pragma solidity ^0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Voting.sol";

contract TestVoting {
    Voting voting = Voting(DeployedAddresses.Voting());


    function testCandidatesAreSetCorrectly() public {
        (string memory name, uint voteCount) = voting.getCandidate(0);
        Assert.equal(voteCount, 0, "Candidate 1 should have 0 votes initially");
    }


    function testVoting() public {
        voting.castVote(0); // Голосование за кандидата 1
        (string memory name, uint voteCount) = voting.getCandidate(0);
        Assert.equal(voteCount, 1, "Candidate 1 should have 1 vote after voting");
    }

    // Проверка, что нельзя проголосовать дважды
    function testCannotVoteTwice() public {
        bool r;
        try voting.castVote(0) {
            r = true;
        } catch {
            r = false;
        }
        Assert.isFalse(r, "User should not be able to vote twice");
    }
}
