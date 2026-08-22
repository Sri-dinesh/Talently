// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title HumanTaskEscrow
/// @author Human API — Monad Blitz Hyderabad V3
/// @notice Escrow and reputation contract for a real-time human micro-task
///         marketplace. One task = one provider slot. A requester locks a
///         MON reward when creating a task; funds release to the provider
///         only after the requester explicitly approves the submitted result.
/// @dev No upgradeability by design — this is a single-deploy hackathon
///      contract. If a bug is found, redeploy and re-point the frontend's
///      contract address. Owner-gated pause exists purely as a live-demo
///      safety valve, not as a governance mechanism.
contract HumanTaskEscrow is ReentrancyGuard, Ownable {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    enum TaskStatus {
        None,       // 0 — default/uninitialized, task ID does not exist
        Open,       // 1 — escrow locked, awaiting a provider to accept
        Accepted,   // 2 — provider assigned, work in progress
        Submitted,  // 3 — provider submitted a result, awaiting approval
        Approved,   // 4 — requester approved, funds released, terminal
        Cancelled   // 5 — requester cancelled pre-acceptance, refunded, terminal
    }

    struct Task {
        address requester;
        address provider;      // address(0) until accepted
        uint256 reward;        // wei-denominated MON amount held in escrow
        TaskStatus status;
        uint64  createdAt;     // block.timestamp at creation, for off-chain sorting/expiry logic
    }

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    /// @notice taskId => Task. taskId is a monotonically increasing counter,
    ///         NOT the same as the application's Postgres cuid — the app
    ///         layer maps its own ID to this integer off-chain.
    mapping(uint256 => Task) public tasks;

    /// @notice Auto-incrementing task ID counter. Starts at 1 so 0 can
    ///         safely mean "does not exist" when checked against tasks[id].status.
    uint256 public nextTaskId = 1;

    /// @notice Count of tasks a provider has been assigned to and had
    ///         approved. Used as the primary on-chain reputation signal.
    mapping(address => uint256) public tasksApproved;

    /// @notice Count of tasks a provider has ever been accepted into,
    ///         regardless of outcome — lets the frontend compute a
    ///         completion rate (tasksApproved / tasksAccepted).
    mapping(address => uint256) public tasksAccepted;

    /// @notice Emergency pause flag. When true, all state-changing
    ///         functions except cancelTask (refund path must always work)
    ///         are blocked. Owner-only toggle.
    bool public paused;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event TaskCreated(uint256 indexed taskId, address indexed requester, uint256 reward, uint64 createdAt);
    event TaskAccepted(uint256 indexed taskId, address indexed provider);
    event ResultSubmitted(uint256 indexed taskId, address indexed provider);
    event TaskApproved(uint256 indexed taskId, address indexed provider, uint256 reward);
    event TaskCancelled(uint256 indexed taskId, address indexed requester, uint256 refund);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    // ---------------------------------------------------------------------
    // Custom errors
    // ---------------------------------------------------------------------

    error ContractPaused();
    error ZeroReward();
    error TaskDoesNotExist();
    error NotTaskRequester();
    error NotTaskProvider();
    error WrongStatus(TaskStatus expected, TaskStatus actual);
    error TransferFailed();
    error CannotAcceptOwnTask();

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier taskExists(uint256 taskId) {
        if (tasks[taskId].status == TaskStatus.None) revert TaskDoesNotExist();
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ---------------------------------------------------------------------
    // Core task lifecycle
    // ---------------------------------------------------------------------

    /// @notice Create a new task and lock the reward in escrow.
    /// @dev msg.value is the full reward for the single provider slot.
    ///      Reverts with ZeroReward if msg.value == 0.
    /// @return taskId The newly created task's on-chain ID.
    function createTask() external payable whenNotPaused returns (uint256 taskId) {
        if (msg.value == 0) revert ZeroReward();

        taskId = nextTaskId++;

        tasks[taskId] = Task({
            requester: msg.sender,
            provider: address(0),
            reward: msg.value,
            status: TaskStatus.Open,
            createdAt: uint64(block.timestamp)
        });

        emit TaskCreated(taskId, msg.sender, msg.value, uint64(block.timestamp));
    }

    /// @notice Accept an open task, assigning yourself as the provider.
    /// @dev A requester cannot accept their own task (prevents trivial
    ///      self-dealing reputation farming).
    function acceptTask(uint256 taskId) external whenNotPaused taskExists(taskId) {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.Open) revert WrongStatus(TaskStatus.Open, task.status);
        if (msg.sender == task.requester) revert CannotAcceptOwnTask();

        task.provider = msg.sender;
        task.status = TaskStatus.Accepted;
        tasksAccepted[msg.sender]++;

        emit TaskAccepted(taskId, msg.sender);
    }

    /// @notice Mark a task's result as submitted. Only callable by the
    ///         assigned provider. Result content itself (text, severity,
    ///         attachments) lives off-chain in Postgres — this call is the
    ///         on-chain checkpoint that gates the requester's ability to
    ///         approve payment.
    function submitResult(uint256 taskId) external whenNotPaused taskExists(taskId) {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.Accepted) revert WrongStatus(TaskStatus.Accepted, task.status);
        if (msg.sender != task.provider) revert NotTaskProvider();

        task.status = TaskStatus.Submitted;

        emit ResultSubmitted(taskId, msg.sender);
    }

    /// @notice Approve a submitted task, releasing escrowed funds to the
    ///         provider and updating their reputation counters.
    /// @dev Follows checks-effects-interactions: all state (status flip,
    ///      reputation increment) is finalized BEFORE the external call
    ///      that sends value, and nonReentrant is layered on top as
    ///      defense-in-depth.
    function approveTask(uint256 taskId) external nonReentrant whenNotPaused taskExists(taskId) {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.Submitted) revert WrongStatus(TaskStatus.Submitted, task.status);
        if (msg.sender != task.requester) revert NotTaskRequester();

        // --- Effects (finalize all state before any external interaction) ---
        uint256 reward = task.reward;
        address provider = task.provider;
        task.status = TaskStatus.Approved;
        task.reward = 0; // clear to prevent any possibility of double-payout accounting
        tasksApproved[provider]++;

        // --- Interaction (external call happens last) ---
        (bool success, ) = payable(provider).call{value: reward}("");
        if (!success) revert TransferFailed();

        emit TaskApproved(taskId, provider, reward);
    }

    /// @notice Cancel an unaccepted task and refund the requester in full.
    /// @dev Only callable while status is Open (i.e. before any provider
    ///      has accepted). This is intentionally ALWAYS callable, even
    ///      while paused, because a stuck/paused contract must never trap
    ///      a requester's funds with no exit path.
    function cancelTask(uint256 taskId) external nonReentrant taskExists(taskId) {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.Open) revert WrongStatus(TaskStatus.Open, task.status);
        if (msg.sender != task.requester) revert NotTaskRequester();

        uint256 refund = task.reward;
        task.status = TaskStatus.Cancelled;
        task.reward = 0;

        (bool success, ) = payable(task.requester).call{value: refund}("");
        if (!success) revert TransferFailed();

        emit TaskCancelled(taskId, msg.sender, refund);
    }

    // ---------------------------------------------------------------------
    // View helpers (for frontend convenience — avoid multiple RPC round trips)
    // ---------------------------------------------------------------------

    /// @notice Returns a provider's approval rate as basis points (0-10000),
    ///         or type(uint256).max if they have never accepted a task
    ///         (frontend should render "No history yet" in that case).
    function approvalRateBps(address provider) external view returns (uint256) {
        uint256 accepted = tasksAccepted[provider];
        if (accepted == 0) return type(uint256).max;
        return (tasksApproved[provider] * 10_000) / accepted;
    }

    // ---------------------------------------------------------------------
    // Owner controls (demo safety valve only)
    // ---------------------------------------------------------------------

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /// @dev Reject any bare ETH/MON transfer that doesn't go through
    ///      createTask() — prevents funds from getting stuck with no
    ///      associated task.
    receive() external payable {
        revert("Use createTask()");
    }
}
