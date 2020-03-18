/**
 * @module resourceFields
 */

/**
 * @param {module:fields} fields
 * @param {module:enums} enums
 */
function resourceFields (fields, resources, enums, web3) {
  const f = fields

  /** 
   * @alias module:resourceFields.ResourceForm
   * @extends module:fields.Form
   */
  class ResourceForm extends fields.Form {
    constructor (model, ...fields) {
      console.assert(model instanceof resources.Thing)
      super(model, ...fields)
    }

    /**
     * Internal function that performs the actual submission,
     * without checking.
     * @returns {Promise.<T>|*}
     * @private
     */
    _submit (op) {
      switch (op) {
        case this.constructor.POST:
          return this.model.post()
        case this.constructor.PATCH:
          return this.model.patch()
        default:
          throw new Error(`Method ${op} not implemented.`)
      }
    }
  }

  /**
   * @alias module:resourceFields.Event
   * @extends module:resourceFields.ResourceForm
   */
  class Event extends ResourceForm {
    constructor (model, ...fields) {
      const def = {namespace: 'r.event'}
      super(model,
        new f.String('name', _.defaults({maxLength: fields.STR_BIG_SIZE}, def)),
        new f.Datepicker('endTime', def),
        new f.Select('severity',
          _.defaults({options: enums.Severity.options(f)}, def)),
        new f.Textarea('description', def),
        ...fields
      )
    }
  }

  /**
   * @alias module:resourceFields.EventWithMultipleDevices
   * @extends module:resourceFields.Event
   */
  class EventWithMultipleDevices extends Event {
    constructor (model, ...fields) {
      super(model, ...fields)
      const devices = new f.Resources('devices', {namespace: 'r.eventWithMultipleDevices'})
      this.fields.splice(1, 0, devices)
    }
  }

  /**
   * @alias module:resourceFields.ToPrepare
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class ToPrepare extends EventWithMultipleDevices {
  }

  /**
   * @alias module:resourceFields.Prepare
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class Prepare extends EventWithMultipleDevices {
  }

  /**
   * @alias module:resourceFields.ToRepair
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class ToRepair extends EventWithMultipleDevices {
  }

  /**
   * @alias module:resourceFields.Ready
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class Ready extends EventWithMultipleDevices {
  }

  /**
   * @alias module:resourceFields.ToDisposeProduct
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class ToDisposeProduct extends EventWithMultipleDevices {
  }

  /**
   * @alias module:resourceFields.Receive
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class Receive extends EventWithMultipleDevices {
  }

  /**
   * @alias module:resourceFields.MakeAvailable
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class MakeAvailable extends EventWithMultipleDevices {
  }

    /**
   * @alias module:resourceFields.Transferred
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class Transferred extends EventWithMultipleDevices {
  }

  /**
   * @alias module:resourceFields.Rent
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class Rent extends EventWithMultipleDevices {
  }

  /**
   * @alias module:resourceFields.CancelTrade
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class CancelTrade extends EventWithMultipleDevices {
  }
  
  /**
   * @alias module:resourceFields.InitTransfer
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class InitTransfer extends EventWithMultipleDevices {
    constructor (model, ...fields) {
      super(model, ...fields)
      const receiver = new f.String('receiver', {namespace: 'r.receiver'})
      this.fields.splice(1, 0, receiver)
    }
  }

  /**
   * @alias module:resourceFields.AcceptTransfer
   * @extends module:resourceFields.EventWithMultipleDevices
   */
  class AcceptTransfer extends EventWithMultipleDevices {
    constructor (model, ...fields) {
      super(model, ...fields)
      // f.patch
      // f.PATCH
      fields.op = this.constructor.PATCH
      const deposit = new f.Number('deposit', {namespace: 'r.deposit'})
      this.fields.splice(1, 0, deposit)
    }
  }

  class BatchProof extends ResourceForm {
    constructor (model, ... fields) {
      super(model, ...fields)
      const devices = new f.Resources('devices', {namespace: 'r.eventWithMultipleDevices'})
      this.fields.splice(1, 0, devices)
    }


    _submit (op) { 
      function generateProof(proof) {
        const genericProps = [ 'type', 'deviceAddress' ]
        const data = _.omit(proof, genericProps)
        const web3Proof = _.pick(proof, genericProps)
        web3Proof.data = data
        
        return web3.generateProof(web3Proof).then((ethereumHash) => {
          proof.ethereumHash = ethereumHash
          return new Promise(resolve => {
            resolve()
          })
        })
      }

      async function generateProofsSerial(proofs) {
        for(const proof of proofs) {
          await generateProof(proof)
        }
        return new Promise(resolve => {
          resolve()
        })
      }

      function generateProofsParallel(proofs) {
        return Promise.all(proofs.map(generateProof))
      }

      switch (op) {
        case this.constructor.POST:
          return generateProofsSerial(this.model.proofs)
          .then(() => {
            return super._submit(op)
          })

          
        default:
          throw new Error(`Method ${op} not implemented.`)
      }
      return super._submit(op).then(() => {
        
      })
    }
  }
  

  return {
    ResourceForm: ResourceForm,
    Event: Event,
    EventWithMultipleDevices: EventWithMultipleDevices,
    ToPrepare: ToPrepare,
    Prepare: Prepare,
    ToRepair: ToRepair,
    Ready: Ready,
    ToDisposeProduct: ToDisposeProduct,
    Receive: Receive,
    MakeAvailable: MakeAvailable,
    Transferred: Transferred,
    BatchProof: BatchProof,
    Rent: Rent,
    CancelTrade: CancelTrade,
    InitTransfer: InitTransfer,
    AcceptTransfer: AcceptTransfer
  }
}

module.exports = resourceFields
