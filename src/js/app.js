App = {
    web3Provider: null,
    contracts: {},

    init: async function () {
        await App.initWeb3();
        return App.initContract();
    },

    initWeb3: async function () {
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
            } catch (error) {
                console.error("User denied account access");
            }
        } else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);
    },

    initContract: function () {
        $.getJSON('VotingContract.json', function (data) {
            var VotingArtifact = data;
            App.contracts.Voting = TruffleContract(VotingArtifact);
            App.contracts.Voting.setProvider(App.web3Provider);
            return App.loadCandidates();
        });

        return App.bindEvents();
    },

    loadCandidates: async function () {
        try {
            const instance = await App.contracts.Voting.deployed();
            const candidates = await instance.getCandidates.call();

            var candidatesRow = $('#candidatesRow');
            candidatesRow.empty();

            for (var i = 0; i < candidates.length; i++) {
                var candidateTemplate = $('#candidateTemplate').clone();
                candidateTemplate.find('.candidate-name').text(candidates[i].name);
                candidateTemplate.find('.vote-button').attr('data-candidate', i);
                candidatesRow.append(candidateTemplate.html());
            }

            await App.checkIfVoted();
        } catch (err) {
            console.log(err.message);
        }
    },

    checkIfVoted: async function () {
        try {
            const accounts = await web3.eth.getAccounts();
            const account = accounts[0];

            const instance = await App.contracts.Voting.deployed();
            const hasVoted = await instance.hasVotedCheck.call(account);

            if (hasVoted) {
                document.querySelectorAll('.vote-button').forEach(button => {
                    button.textContent = "You have already voted";
                    button.disabled = true;
                });
            }
        } catch (err) {
            console.log("Error checking if voted: ", err);
        }
    },

    bindEvents: function () {
        $(document).on('click', '.vote-button', App.handleVote);
    },

    handleVote: async function (event) {
        event.preventDefault();
        const candidateId = parseInt($(event.target).data('candidate'));

        try {
            const accounts = await web3.eth.getAccounts();
            const account = accounts[0];

            const instance = await App.contracts.Voting.deployed();
            const hasVoted = await instance.hasVotedCheck.call(account);

            if (hasVoted) {
                alert("You have already voted!");
                return;
            }

            await instance.vote(candidateId, { from: account });
            alert(`Successfully voted for candidate ${candidateId}`);
            await App.loadCandidates(); // Reload candidates after voting
        } catch (err) {
            console.log("Voting error: ", err);
        }
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
