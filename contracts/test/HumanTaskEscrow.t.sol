// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {HumanTaskEscrow} from "../src/HumanTaskEscrow.sol";

contract HumanTaskEscrowTest is Test {
    HumanTaskEscrow escrow;

    address owner = address(0x1);
    address requester = address(0x2);
    address provider = address(0x3);
    address stranger = address(0x4);

    function setUp() public {
        escrow = new HumanTaskEscrow(owner);
        vm.deal(requester, 10 ether);
        vm.deal(provider, 1 ether);
        vm.deal(stranger, 1 ether);
    }

    // --- Happy path ---

    function test_FullLifecycle_HappyPath() public {
        vm.prank(requester);
        uint256 taskId = escrow.createTask{value: 1 ether}();

        (address r,, uint256 reward, HumanTaskEscrow.TaskStatus status,) = escrow.tasks(taskId);
        assertEq(r, requester);
        assertEq(reward, 1 ether);
        assertEq(uint8(status), uint8(HumanTaskEscrow.TaskStatus.Open));

        vm.prank(provider);
        escrow.acceptTask(taskId);

        vm.prank(provider);
        escrow.submitResult(taskId);

        uint256 providerBalanceBefore = provider.balance;

        vm.prank(requester);
        escrow.approveTask(taskId);

        assertEq(provider.balance, providerBalanceBefore + 1 ether);
        assertEq(escrow.tasksApproved(provider), 1);
        assertEq(escrow.tasksAccepted(provider), 1);
    }

    // --- Access control reverts ---

    function test_RevertWhen_NonProviderSubmits() public {
        vm.prank(requester);
        uint256 taskId = escrow.createTask{value: 1 ether}();
        vm.prank(provider);
        escrow.acceptTask(taskId);

        vm.prank(stranger);
        vm.expectRevert(HumanTaskEscrow.NotTaskProvider.selector);
        escrow.submitResult(taskId);
    }

    function test_RevertWhen_NonRequesterApproves() public {
        vm.prank(requester);
        uint256 taskId = escrow.createTask{value: 1 ether}();
        vm.prank(provider);
        escrow.acceptTask(taskId);
        vm.prank(provider);
        escrow.submitResult(taskId);

        vm.prank(stranger);
        vm.expectRevert(HumanTaskEscrow.NotTaskRequester.selector);
        escrow.approveTask(taskId);
    }

    function test_RevertWhen_RequesterAcceptsOwnTask() public {
        vm.prank(requester);
        uint256 taskId = escrow.createTask{value: 1 ether}();

        vm.prank(requester);
        vm.expectRevert(HumanTaskEscrow.CannotAcceptOwnTask.selector);
        escrow.acceptTask(taskId);
    }

    // --- State machine reverts ---

    function test_RevertWhen_AcceptingAlreadyAcceptedTask() public {
        vm.prank(requester);
        uint256 taskId = escrow.createTask{value: 1 ether}();
        vm.prank(provider);
        escrow.acceptTask(taskId);

        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                HumanTaskEscrow.WrongStatus.selector,
                HumanTaskEscrow.TaskStatus.Open,
                HumanTaskEscrow.TaskStatus.Accepted
            )
        );
        escrow.acceptTask(taskId);
    }

    function test_RevertWhen_ApprovingBeforeSubmission() public {
        vm.prank(requester);
        uint256 taskId = escrow.createTask{value: 1 ether}();
        vm.prank(provider);
        escrow.acceptTask(taskId);

        vm.prank(requester);
        vm.expectRevert(
            abi.encodeWithSelector(
                HumanTaskEscrow.WrongStatus.selector,
                HumanTaskEscrow.TaskStatus.Submitted,
                HumanTaskEscrow.TaskStatus.Accepted
            )
        );
        escrow.approveTask(taskId);
    }

    function test_RevertWhen_CreatingWithZeroValue() public {
        vm.prank(requester);
        vm.expectRevert(HumanTaskEscrow.ZeroReward.selector);
        escrow.createTask{value: 0}();
    }

    function test_RevertWhen_TaskDoesNotExist() public {
        vm.prank(provider);
        vm.expectRevert(HumanTaskEscrow.TaskDoesNotExist.selector);
        escrow.acceptTask(999);
    }

    // --- Cancellation / refund path ---

    function test_Cancel_RefundsRequesterInFull() public {
        vm.prank(requester);
        uint256 taskId = escrow.createTask{value: 1 ether}();

        uint256 balanceBefore = requester.balance;

        vm.prank(requester);
        escrow.cancelTask(taskId);

        assertEq(requester.balance, balanceBefore + 1 ether);
    }

    function test_RevertWhen_CancellingAcceptedTask() public {
        vm.prank(requester);
        uint256 taskId = escrow.createTask{value: 1 ether}();
        vm.prank(provider);
        escrow.acceptTask(taskId);

        vm.prank(requester);
        vm.expectRevert(
            abi.encodeWithSelector(
                HumanTaskEscrow.WrongStatus.selector,
                HumanTaskEscrow.TaskStatus.Open,
                HumanTaskEscrow.TaskStatus.Accepted
            )
        );
        escrow.cancelTask(taskId);
    }

    function test_Cancel_WorksEvenWhenPaused() public {
        vm.prank(requester);
        uint256 taskId = escrow.createTask{value: 1 ether}();

        vm.prank(owner);
        escrow.pause();

        // cancelTask has no whenNotPaused modifier by design — must always work
        vm.prank(requester);
        escrow.cancelTask(taskId);
    }

    // --- Pause behavior ---

    function test_RevertWhen_CreatingWhilePaused() public {
        vm.prank(owner);
        escrow.pause();

        vm.prank(requester);
        vm.expectRevert(HumanTaskEscrow.ContractPaused.selector);
        escrow.createTask{value: 1 ether}();
    }

    function test_RevertWhen_NonOwnerPauses() public {
        vm.prank(stranger);
        vm.expectRevert(); // Ownable's own custom error, selector not re-declared here
        escrow.pause();
    }

    // --- Reputation / view helpers ---

    function test_ApprovalRateBps_ComputesCorrectly() public {
        vm.prank(requester);
        uint256 t1 = escrow.createTask{value: 1 ether}();
        vm.prank(provider);
        escrow.acceptTask(t1);
        vm.prank(provider);
        escrow.submitResult(t1);
        vm.prank(requester);
        escrow.approveTask(t1);

        assertEq(escrow.approvalRateBps(provider), 10_000); // 100%
    }

    function test_ApprovalRateBps_NoHistoryReturnsMax() public view {
        assertEq(escrow.approvalRateBps(stranger), type(uint256).max);
    }
}
