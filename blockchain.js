const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const { v4: uuid } = require('uuid');

function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];
    //The genisis block (First block of the blockchain)
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    this.createNewBlock(100, '0', '0');
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timeStamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce: nonce,
        previousBlockHash: previousBlockHash,
        hash: hash
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
}

Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid().split('-').join('')
    };

    return newTransaction;
}

Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
}

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockHash, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockHash);
    const hash = sha256(dataAsString);

    return hash;
}

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockHash) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockHash, nonce);
    while(hash.substring(0,4) != '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockHash, nonce);
    }

    return nonce;
}

Blockchain.prototype.chainIsValid = function(blockchain) {
    let validChain = true;
    let length = blockchain['chain'].length;
    for(let i = 1; i < length; i++) {
        let currentBlock = blockchain['chain'][i];
        let previousBlock = blockchain['chain'][i-1];
        let blockHash = this.hashBlock(previousBlock['hash'], { transaction: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);
        if(currentBlock['previousBlockHash'] !== previousBlock['hash']) {
            validChain = false;
        }
        if(blockHash.substring(0,4) !== '0000') {
            validChain = false;
        }
    }

    var genisisBlock = blockchain['chain'][0];
    if(genisisBlock['nonce'] !== 100 || genisisBlock['previousBlockHash'] !== '0' || genisisBlock['hash'] !== '0' || genisisBlock['transactions'].length !== 0) {
        validChain = false;
    }
    return validChain;
}

Blockchain.prototype.getBlock = function(blockHash) {
    let correctBlock = null;
    this.chain.forEach(block => {
        if(block.hash === blockHash) {
            correctBlock = block;
        }
    })
    return correctBlock;
}

Blockchain.prototype.getTransaction = function(transactionId) {
    let correctTransaction = null;
    let correctBlock = null;

    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if(transaction.transactionId === transactionId) {
                correctTransaction = transaction;
                correctBlock = block;
            }
        })
    })
    return {
        transaction: correctTransaction,
        block: correctBlock
    };
}

Blockchain.prototype.getAddressData = function(address) {
    var addressTransactions = [];

    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if(transaction.sender === address || transaction.recipient === address) {
                addressTransactions.push(transaction);
            }
        })
    })

    let balance = 0;

    addressTransactions.forEach(transaction => {
        if(transaction.recipient === address) {
            balance += transaction.amount;
        } else if(transaction.sender === address) {
            balance -= transaction.amount;
        }
    })

    return {
        addressTransactions: addressTransactions,
        addressBalance: balance
    }
}

module.exports = Blockchain;