// Shared presentation layer for index.html and vote.html.
// Contract calls (castVote / hasVotedCheck / getCandidates) are untouched —
// this file only determines wallet/network state and renders UI around them.

const CONTRACT_JSON_PATH = 'Voting.json';
const CONTRACT_NETWORK_KEY = '5777';
const FALLBACK_RPC = 'http://127.0.0.1:7545';

const CANDIDATES_META = [
    { id: 0, name: 'Kamala Harris', party: 'Democratic Party', photo: 'images/candidate1.jpg' },
    { id: 1, name: 'Donald Trump', party: 'Republican Party', photo: 'images/candidate2.jpg' },
];

let artifactPromise = null;
function loadArtifact() {
    if (!artifactPromise) {
        artifactPromise = fetch(CONTRACT_JSON_PATH).then((r) => r.json());
    }
    return artifactPromise;
}

function shortenAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// Provider for reading data (vote counts etc.) — works even without MetaMask,
// with a fallback to the local node since the project is pinned to network '5777' in the build artifacts.
function getReadWeb3() {
    const provider = window.ethereum || new Web3.providers.HttpProvider(FALLBACK_RPC);
    return new Web3(provider);
}

async function getContractRead() {
    const artifact = await loadArtifact();
    const address = artifact.networks[CONTRACT_NETWORK_KEY].address;
    const web3 = getReadWeb3();
    return { contract: new web3.eth.Contract(artifact.abi, address), web3, address };
}

// Requires MetaMask — for reading the user's account and sending transactions.
async function getContractWrite() {
    const artifact = await loadArtifact();
    const address = artifact.networks[CONTRACT_NETWORK_KEY].address;
    const web3 = new Web3(window.ethereum);
    return { contract: new web3.eth.Contract(artifact.abi, address), web3, address };
}

// Detects wallet state without prompting a popup (does not call eth_requestAccounts).
async function detectWalletStatus() {
    if (typeof window.ethereum === 'undefined') {
        return { status: 'no-metamask' };
    }

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts.length) {
        return { status: 'not-connected' };
    }

    try {
        const { web3, address } = await getContractWrite();
        const code = await web3.eth.getCode(address);
        if (code === '0x' || code === '0x0') {
            return { status: 'wrong-network', account: accounts[0] };
        }
    } catch (err) {
        return { status: 'wrong-network', account: accounts[0] };
    }

    return { status: 'connected', account: accounts[0] };
}

const BANNER_CONTENT = {
    'no-metamask': {
        variant: 'danger',
        icon: '⚠',
        text: 'MetaMask not found. Install the extension to vote.',
        actionLabel: null,
    },
    'not-connected': {
        variant: 'warning',
        icon: '🔌',
        text: 'Wallet not connected.',
        actionLabel: 'Connect MetaMask',
    },
    'wrong-network': {
        variant: 'warning',
        icon: '🌐',
        text: 'MetaMask is connected to the wrong network. Switch to the local Ganache network (127.0.0.1:7545).',
        actionLabel: 'Check again',
    },
    connected: {
        variant: 'success',
        icon: '✓',
        text: '',
        actionLabel: null,
    },
};

// Renders the wallet status banner into the given container.
// onConnect fires on the action button click (connect / check again).
function renderStatusBanner(container, result, onConnect) {
    const cfg = BANNER_CONTENT[result.status];
    container.className = `status-banner status-banner--${cfg.variant}`;
    container.setAttribute('role', 'status');

    const text = result.status === 'connected'
        ? `Connected: ${shortenAddress(result.account)}`
        : cfg.text;

    container.innerHTML = `
        <span class="status-banner__icon" aria-hidden="true">${cfg.icon}</span>
        <span class="status-banner__text">${text}</span>
    `;

    if (cfg.actionLabel) {
        const btn = document.createElement('button');
        btn.className = 'status-banner__action';
        btn.type = 'button';
        btn.textContent = cfg.actionLabel;
        btn.addEventListener('click', onConnect);
        container.appendChild(btn);
    }
}

// Controls the visual state of a vote button: idle / pending / voted / error.
function setVoteButtonState(button, state, text) {
    button.classList.remove('is-pending', 'is-voted', 'is-error');
    button.disabled = false;

    let label;
    switch (state) {
        case 'pending':
            button.classList.add('is-pending');
            button.disabled = true;
            label = text || 'Confirm in MetaMask…';
            break;
        case 'voted':
            button.classList.add('is-voted');
            button.disabled = true;
            label = text || 'You have already voted';
            break;
        case 'error':
            button.classList.add('is-error');
            label = text || 'Error, try again';
            setTimeout(() => button.classList.remove('is-error'), 1600);
            break;
        default:
            label = text || button.dataset.defaultLabel || '';
    }

    button.dataset.label = label;
    button.setAttribute('aria-label', label);

    const card = button.closest('.vote-card');
    const statusEl = card ? card.querySelector('.vote-status') : null;
    if (statusEl) {
        statusEl.className = 'vote-status';
        if (state === 'voted') {
            statusEl.classList.add('vote-status--voted');
            statusEl.textContent = `✓ ${label}`;
        } else if (state === 'error') {
            statusEl.classList.add('vote-status--error');
            statusEl.textContent = label;
        } else {
            statusEl.textContent = '';
        }
    }
}

function describeTxError(error) {
    if (error && (error.code === 4001 || /User denied/i.test(error.message || ''))) {
        return 'Transaction rejected in MetaMask.';
    }
    if (error && /already voted/i.test(error.message || '')) {
        return 'This address has already voted.';
    }
    if (error && /insufficient funds/i.test(error.message || '')) {
        return 'Insufficient ETH to pay for gas.';
    }
    return 'Could not submit your vote. Check the network and try again.';
}
