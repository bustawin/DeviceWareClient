const Proof = require('./Proof')

class ReuseProof extends Proof {
  constructor (web3, data) {
    super(web3, data)
    this.extractData(web3, data)
  }

  generateProof (device, account) {
    return new Promise(resolve => {
      return device.generateReuseProof(this.segment, this.idReceipt,
        this.supplier, this.receiver, this.price, { from: account })
        .then(hash => {
          resolve(hash)
        })
    })
  }

  extractData (web3, data) {
    this.segment = data.segment
    this.idReceipt = data.idReceipt
    this.supplier = web3.utils.toChecksumAddress(data.supplier)
    this.receiver = web3.utils.toChecksumAddress(data.receiver)
    this.price = data.price
  }
}

module.exports = ReuseProof
