/*global beforeEach,afterEach,describe,it*/
import { expect } from 'chai'
import controller from '../helpers/controller'
import driver from '../../src/driver'

const modules = controller.getModules()
let tree
const bind = function () {
  return driver({ module: modules.form, modules, state: tree.get() })
}

describe('bindings', function () {
  afterEach(function () {
    controller.reset()
  })

  describe('select', function () {
    beforeEach(function () {
      tree = controller.model.tree
      tree.set({ form: { select: 1 } })
      tree.commit()
    })

    it('combines the properties of input, menu and menuOpen', function () {
      let props = bind().select('select')
      expect(props.value).to.equal(1)
      expect(props.isOpen).to.be.false
      expect(props.isError).to.be.false
      expect(props.message).to.be.undefined
      expect(props.onChange).to.be.a.function
      expect(props.onOpen).to.be.a.function
      expect(props.onClose).to.be.a.function
    })
  })
})