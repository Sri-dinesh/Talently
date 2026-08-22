// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HumanTaskEscrow} from "../src/HumanTaskEscrow.sol";

contract DeployScript is Script {
    function run() external returns (HumanTaskEscrow) {
        vm.startBroadcast();
        HumanTaskEscrow escrow = new HumanTaskEscrow(msg.sender);
        vm.stopBroadcast();

        console.log("HumanTaskEscrow deployed at:", address(escrow));
        console.log("Owner set to:", msg.sender);
        return escrow;
    }
}
