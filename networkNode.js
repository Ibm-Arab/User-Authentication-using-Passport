const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { v4: uuid } = require('uuid');
const port = process.argv[2];
const rp = require('request-promise');

const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();

const nodeAddress = uuid().split('-').join('');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/blockchain', function(req,res) {
    res.send(bitcoin);
})

app.post('/transaction', function(req, res) {
    var newTransaction = req.body;
    var blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json({note: `Added to the Index of ${blockIndex}`});
})

app.post('/transaction/broadcast', function(req, res) {
    var newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    bitcoin.addTransactionToPendingTransactions(newTransaction);

    var requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        var requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        }
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(data => {
        res.json({note: 'Transaction created and broadcast successfully.'});
    })
})

app.get('/mine', function(req, res) {
    var lastBlock = bitcoin.getLastBlock();
    var previousBlockHash = lastBlock['hash'];
    var currentBlockData = {
        transaction: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1
    };
    var nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    var blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
    var newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

    var requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        var requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: {newBlock : newBlock},
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(data => {
        var requestOptions = {
            uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
            method: 'POST',
            body: {
                amount: 12.5,
                sender: "00",
                recipient: nodeAddress
            },
            json: true
        };
        return rp(requestOptions);
    })
    .then(data => {
        res.json({
            'note': 'New Block Created',
            'block': newBlock
        });
    });
})

app.post('/receive-new-block', function(req, res) {
    var newBlock = req.body.newBlock;
    var lastBlock = bitcoin.getLastBlock();
    if(lastBlock.hash == newBlock.previousBlockHash && lastBlock['index'] + 1 == newBlock['index']) {
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        res.json({
            note: 'New block received and accepted',
            newBlock: newBlock
        })
    } else {
        res.json({
            note: 'New block rejected',
            newBlock: newBlock
        })
    }
})

app.post('/register-broadcast-node', function(req, res) {
    var newNodeUrl = req.body.newNodeUrl;
    if(bitcoin.networkNodes.indexOf(newNodeUrl) == -1) {
        bitcoin.networkNodes.push(newNodeUrl);
    }

    var regNodesPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        var requestOptions = {
            url: networkNodeUrl + '/register-node',
            method: 'POST',
            body: {newNodeUrl: newNodeUrl},
            json: true
        };
        regNodesPromises.push(rp(requestOptions));
    })

    Promise.all(regNodesPromises)
    .then(data => {
        var bulkRegisterOptions = {
            url: newNodeUrl + '/register-nodes-bulk',
            method: 'POST',
            body: {allNetworkNodes : [...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
            json: true
        };

        return rp(bulkRegisterOptions);
    })
    .then(data => {
        res.json({note: 'New node registered with network successfully.'});
    })
})

app.post('/register-node', function(req, res) {
    var newNodeUrl = req.body.newNodeUrl;
    if(bitcoin.networkNodes.indexOf(newNodeUrl) == -1 && bitcoin.currentNodeUrl !== newNodeUrl) {
        bitcoin.networkNodes.push(newNodeUrl);
    }
    res.json({note: 'New node registered successfully.'});
})

app.post('/register-nodes-bulk', function(req, res) {
    var allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        if(bitcoin.networkNodes.indexOf(networkNodeUrl) == -1 && bitcoin.currentNodeUrl !== networkNodeUrl) {
            bitcoin.networkNodes.push(networkNodeUrl);
        }
    })
    res.json({note: 'Bulk registration successfull.'})
})

app.get('/consensus', function(req, res) {
	var requestPromises = [];
	bitcoin.networkNodes.forEach(networkNodeUrl => {
		var requestOptions = {
			uri: networkNodeUrl + '/blockchain',
			method: 'GET',
			json: true
		};

		requestPromises.push(rp(requestOptions))
	})

	Promise.all(requestPromises)
	.then(blockchains => {
		const currentChainLength = bitcoin.chain.length;
		let maxChainLength = currentChainLength;
		let newLongestChain = null;
		let newPendingTransactions = null;
        let forValidCheck = null;

		blockchains.forEach(blockchain => {
			if (blockchain.chain.length > maxChainLength) {
				maxChainLength = blockchain.chain.length;
				newLongestChain = blockchain.chain;
                forValidCheck = blockchain;
				newPendingTransactions = blockchain.pendingTransactions;
			}
		})

		if (!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(forValidCheck))) {
			res.json({
				note: 'Current chain has not been replaced.',
				chain: bitcoin.chain
			})
		}
		else {
			bitcoin.chain = newLongestChain;
			bitcoin.pendingTransactions = newPendingTransactions;
			res.json({
				note: 'This chain has been replaced.',
				chain: bitcoin.chain
			})
		}

	})
})

app.get('/block/:blockHash', function(req, res) {
    var blockHash = req.params.blockHash;
    var correctBlock = bitcoin.getBlock(blockHash);
    res.json({
        block: correctBlock
    })
})

app.get('/transaction/:transactionId', function(req, res) {
    var transactionId = req.params.transactionId;
    var transactionData = bitcoin.getTransaction(transactionId);
    res.json({
        transaction: transactionData.transaction,
        block: transactionData.block
    })
})

app.get('/address/:address', function(req, res) {
    var address = req.params.address;
    var addressData = bitcoin.getAddressData(address);
    
    res.json({
        addressData: addressData
    })
})

app.listen(port, function() {
    console.log('Server running at Port '+port);
})