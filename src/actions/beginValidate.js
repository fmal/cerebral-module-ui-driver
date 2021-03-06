export default function beginValidate (context) {
  const {
    modules,
    input: {
      driverModuleName,
      fields,
      moduleName,
      validateForm
    },
    state,
    output
  } = context
  const driverModule = modules[driverModuleName]
  const formModule = modules[moduleName]
  const form = formModule.meta.form
  const driverOptions = driverModule.meta.options
  const formOptions = form.driverOptions || {}
  const values = []
  const fieldNames = fields.map((field) => field.name)

  let isValid = true

  fields.forEach((field) => {
    // get the value and check its type
    const fieldPath = [moduleName, 'fields', field.name]
    const driverFieldPath = [...driverModule.path, ...fieldPath]
    let value
    if (!validateForm) {
      // single field validation values come from input and may need to be cast
      value = !field.noCasting && field.type && driverOptions.casts[field.type]
        ? driverOptions.casts[field.type](field.value, Object.assign({}, driverOptions, formOptions))
        : { isTypeValid: true, typedValue: field.value }
    } else {
      // form validation values come from state (previous single field validation result is used if found)
      value = state.get(driverFieldPath)
      value = Object.assign({
        isTypeValid: true,
        typedValue: state.get([...formModule.path, field.name])
      }, value)
    }
    value.name = field.name

    if (value.isTypeValid) {
      value.isValid = true
      value.error = null
      // update the form value
      state.set([...formModule.path, field.name], value.typedValue)
      // validate the value
      const formField = form.fields[field.name] || {}
      if (typeof formField.validate === 'function') {
        value.isValidating = true
        values.push(value)
      }
    } else {
      // type was not valid
      isValid = false
      value.isValid = false
    }

    // update the driver form value
    if (state.get(driverFieldPath)) {
      state.merge(driverFieldPath, value)
    } else {
      state.set(driverFieldPath, value)
    }
  })

  state.set([...driverModule.path, moduleName, 'error'], isValid
    ? ''
    : formOptions.invalidMessage || driverOptions.invalidMessage)
  state.set([...driverModule.path, moduleName, 'isValidating'], true)

  output({ moduleName, fields: values, validateForm, fieldNames })
}
