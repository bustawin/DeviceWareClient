const deployments = require('./web3/deployment')
const deliveryNoteUtils = require('./web3/deliverynote')
const devicesUtils = require('./web3/devices')
const accountsUtils = require('./web3/accounts')

/**
 * Returns a global progressBar singleton.
 *
 * @param ngProgressFactory
 * @returns {progressBar}
 */
function web3Service ($window) {
  const provider = new $window.web3.providers.WebsocketProvider('ws://' + $window.CONSTANTS.blockchain + ':8545')
  const web3 = new $window.web3(provider)
  const contract = $window.contract
  let factory, erc20, dao

  deployments.deployContracts(web3, contract, provider).then(res => {
    factory = res[0]
    erc20 = res[1]
    dao = res[2]
  })

  const service = {
    post: (obj) => {
      console.log('web3 post', obj)
    },
    patch: (obj) => {
      console.log('web3 patch', obj)
      // TODO send request to web3
      const response = 'hello'
      return response
    },
    initTransfer: (obj) => {
      console.log(obj)
      let sender = web3.utils.toChecksumAddress(obj.sender)
      let receiver = web3.utils.toChecksumAddress(obj.receiver_address)
      return initTransfer(sender, receiver, obj.devices, web3)
    },
    acceptTransfer: (obj) => {
      console.log(obj)
      let receiver = web3.utils.toChecksumAddress(obj.receiver_address)
      let deposit = parseInt(obj.deposit)
      let deliverynoteAddress = obj.deliverynote_address
      let a = acceptTransfer(deliverynoteAddress, receiver, deposit, erc20)
      console.log(a)
      return a
    }
  }

  /** Function that implements the initialization of a DeliveryNote
   *  transfer
  * @param {string} sender Ethereum address of sender (and transaction emmitter).
  * @param {string} receiver Ethereum address of receiver.
  * @param {Array} devices List of devices to be added to the DeliveryNote.
  * @param {Function} web3 Web3.js library
  * @returns {Promise} Promise which resolves to DeliveryNote address.
  */
  function initTransfer (sender, receiver, devices, web3) {
    console.log('initTransfer')
    return new Promise(resolve => {
      devicesUtils.deployDevices(factory, devices, sender, web3).then(() => {
        factory.getDeployedDevices({ from: sender }).then(devices => {
          deliveryNoteUtils.createDeliveryNote(contract, provider, devices, sender, receiver, dao)
            .then(deliveryNote => {
              deliveryNote.emitDeliveryNote({from: sender})
              console.log(deliveryNote)
              resolve(deliveryNote.address)
            })
        })
      })
    })
  }

  /** Function that implements the acceptance of a DeliveryNote
  *  transfer
  * @param {string} deliverynote_address Ethereum address of deliveryNote Contract
  * @param {string} receiver Ethereum address of receiver.
  * @param {number} deposit Deposit agreed.
  * @returns {Promise} Promise that resolves to boolean
  */
  function acceptTransfer (deliveryNoteAddress, receiver, deposit, erc20) {
    console.log('AcceptTransfer')
    return new Promise(resolve => {
      erc20.approve(deliveryNoteAddress, deposit,
        { from: receiver,
          gas: '6721975'})
        .then(() => {
          deliveryNoteUtils.acceptDeliveryNote(contract, provider, deliveryNoteAddress,
            receiver, deposit)
            .then(result => {
              resolve(result)
            })
        })
    })
  }
  return service
}

module.exports = web3Service
