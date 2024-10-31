// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    uint public totalCandidates;

    event Voted(address voter, uint candidateId);

    constructor(string[] memory candidateNames) {
        totalCandidates = candidateNames.length;
        for (uint i = 0; i < candidateNames.length; i++) {
            candidates[i] = Candidate(candidateNames[i], 0);
        }
    }

    function castVote(uint candidateId) public {
        require(!hasVoted[msg.sender], "You have already voted!");
        require(candidateId >= 0 && candidateId < totalCandidates, "Invalid candidate ID");

        candidates[candidateId].voteCount++;
        hasVoted[msg.sender] = true;

    
        emit Voted(msg.sender, candidateId);
    }

    function getCandidate(uint candidateId) public view returns (string memory, uint) {
        require(candidateId >= 0 && candidateId < totalCandidates, "Invalid candidate ID");
        return (candidates[candidateId].name, candidates[candidateId].voteCount);
    }
    
    function hasVotedCheck(address user) public view returns (bool) {
        return hasVoted[user];
    }

    function getCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory candidateList = new Candidate[](totalCandidates);
        for (uint i = 0; i < totalCandidates; i++) {
            candidateList[i] = candidates[i];
        }
        return candidateList;
    }
}