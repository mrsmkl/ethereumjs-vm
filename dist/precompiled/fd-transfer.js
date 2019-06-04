'use strict';

var utils = require('ethereumjs-util');
var BN = utils.BN;
var error = require('../exceptions.js').ERROR;
var assert = require('assert');

function OOGResult(gasLimit) {
  return {
    return: Buffer.alloc(0),
    gasUsed: opts.gasLimit,
    exception: 0, // 0 means VM fail (in this case because of OOG)
    exceptionError: error.OUT_OF_GAS
  };
}

function incrementBalance(stateManager, address, delta, callback) {
  stateManager.getAccount(address, function (err, account) {
    if (err) {
      callback(err);
      return;
    }

    account.balance = new BN(account.balance).add(delta).toBuffer();
    stateManager.putAccount(address, account, function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    });
  });
}

module.exports = function (opts, cb) {
  assert(opts.data);

  var results = {};

  // TODO(asa): Pick an appropriate gas amount
  results.gasUsed = new BN(20);
  if (opts.gasLimit.lt(results.gasUsed)) {
    cb(error.OUT_OF_GAS, OOGResult(gasLimit));
    return;
  }

  var fromAddress = opts.data.slice(0, 32);
  var toAddress = opts.data.slice(32, 64);
  var value = new BN(opts.data.slice(64, 96));

  var failIfErr = function failIfErr(err) {
    if (err) {
      results.return = Buffer.alloc(0);
      results.exception = 0;
      cb(err, results);
    }
  };

  incrementBalance(opts.stateManager, fromAddress, value.neg(), function (err) {
    failIfErr(err);
    if (!err) {
      incrementBalance(opts.stateManager, toAddress, value, function (err) {
        failIfErr(err);
        if (!err) {
          results.return = true;
          results.exception = 1;
          cb(err, results);
        }
      });
    }
  });
};