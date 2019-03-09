pragma solidity ^0.4.24;

/*
This Token Contract implements the standard token functionality (https://github.com/ethereum/EIPs/issues/20), the ERC223 functionality (https://github.com/ethereum/EIPs/issues/223) as well as the following OPTIONAL extras intended for use by humans.

In other words. This is intended for deployment in something like a Token Factory or Mist wallet, and then used by humans.
Imagine coins, currencies, shares, voting weight, etc.
Machine-based, rapid creation of many tokens would not necessarily need these extra features or will be minted in other manners.

1) Initial Finite Supply (upon creation one specifies how much is minted).
2) In the absence of a token registry: Optional Decimal, Symbol & Name.

.*/

import "./StandardToken.sol";

/// @title VictionToken
contract VictionToken is StandardToken {

    /*
     *  Token metadata
     */
    string public version = 'H0.1';       //human 0.1 standard. Just an arbitrary versioning scheme.
    string public name = 'VictionToken';
    string public symbol = 'VTK';
    uint8 public _decimals = 18;
    uint256 public multiplier;

    address public owner_address;

    /*
     * Events
     */
    event Minted(address indexed _to, uint256 indexed _num);

    /// @notice Allows `num` tokens to be minted and assigned to `msg.sender`
    function mint(uint256 num) public {
        mintFor(num, msg.sender);
    }

    /// @notice Allows `num` tokens to be minted and assigned to `target`
    function mintFor(uint256 num, address target) public {
        balances[target] += num;
        _total_supply += num;

        emit Minted(target, num);

        //require(balances[target] >= num);
        //assert(_total_supply >= num);
    }

    /// @notice Transfers the collected ETH to the contract owner.
    function transferFunds() public {
        require(msg.sender == owner_address);
        require(address(this).balance > 0);

        owner_address.transfer(address(this).balance);
        assert(address(this).balance == 0);
    }

    function decimals() public view returns (uint8 decimals) {
        return _decimals;
    }
}
