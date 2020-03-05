const DataWipeProof = require('./proofs/DataWipeProof')
const FunctionProof = require('./proofs/FunctionProof')
const ReuseProof = require('./proofs/ReuseProof')
const RecycleProof = require('./proofs/RecycleProof')
const TransferProof = require('./proofs/TransferProof')
const deviceUtils = require('./device_utils')

const functions = {
  generateProof: (web3, device, type, data) => {
    return getProof(web3, device, type).generateProof(web3, data)
  },
  getProofData: (device, type, hash, account) => {
    return getProof(device, hash, type).getProofData(hash, account)
  },
  getAllOwnerProofs: (contract, provider, owner) => {
    return getAllOwnerProofs(contract, provider, owner)
  }
}

let proofTypes = {
  WIPE: 'wipe',
  FUNCTION: 'function',
  TRANSFER: 'transfer',
  RECYCLE: 'recycle',
  REUSE: 'reuse'
}

/**
 * Extracts all proofs from all the devices of a given owner.
 * @param {Function} contract truffle-contract library.
 * @param {Function} provider blockchain provider configuration.
 * @param {string} owner ethereum address from owner.
 */
function getAllOwnerProofs (contract, provider, owner) {
  let proofHashes = []
  return new Promise(resolve => {
    deviceUtils.getDeployedDevicePerOwner(owner).then(devices => {
      devices.foreach((deviceAddress) => {
        extractProofsFromDevice(contract, provider, deviceAddress).then(hashes => {
          proofHashes += hashes
        })
      })
      resolve(proofHashes)
    })
  })
}

/**
 * Extracts all proofs from a given device.
 * @param {Function} contract truffle-contract library.
 * @param {Function} provider blockchain provider configuration.
 * @param {string} deviceAddress ethereum address from device.
 */
function extractProofsFromDevice (contract, provider, deviceAddress) {
  let proofs = []
  return new Promise(resolve => {
    functions.getDeployedDevice(contract, provider, deviceAddress).then(device => {
      proofTypes.foreach(type => {
        device.getProofs(type).then(hash => {
          proofs.push({ 'type': proofTypes[type], 'hash': hash })
        })
      })
      resolve(proofs)
    })
  })
}

/**
 * Returns the proof object corresponding to the received type.
 * @param {Function} web3 Web3.js library.
 * @param {Function} device Blockchain smart contract object.
 * @param {string} type Type of the proof to be generated.
 * @param {JSON} data JSON structure with the information needed for the
 *                    proof to be generated.
 * @returns {Promise} A promise that resolves to the ethereum address of the
 *                    generated proof.
 */
function getProof (web3, device, type) {
  switch (type) {
    case proofTypes.WIPE:
      return new DataWipeProof(web3, device)
    case proofTypes.FUNCTION:
      return new FunctionProof(web3, device)
    case proofTypes.REUSE:
      return new ReuseProof(web3, device)
    case proofTypes.RECYCLE:
      return new RecycleProof(web3, device)
    case proofTypes.TRANSFER:
      return new TransferProof(web3, device)
    default:
      break
  }
}

/**
 * Returns the block information stored for a given proof. Used for the block
 * explorer.
 * @param {Function} device Blockchain smart contract object.
 * @param {string} hash unique proof identifier.
 * @param {string} type type of the proof.
 * @returns {Promise} A promise that resolves to the block information related
 *                    to some proof.
 */
function getProofBlockInfo (device, hash, type) {
  return device.getProof(hash, type)
}

module.exports = functions
