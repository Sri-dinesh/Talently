// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HumanTaskEscrow} from "../src/HumanTaskEscrow.sol";

contract DeployScript is Script {
    function run() external returns (HumanTaskEscrow) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);
        HumanTaskEscrow escrow = new HumanTaskEscrow(deployer);
        vm.stopBroadcast();

        console.log("HumanTaskEscrow deployed at:", address(escrow));
        console.log("Owner set to:", deployer);
        return escrow;
    }
}
