import moment from 'moment';
import sideEffects from './sideEffects';

export default {

  registerSideEffect: sideEffects.register,

  createForm(formStatePath) {
    const formPath = Array.isArray(formStatePath) ? formStatePath : [formStatePath];
    const formName = formPath.join('.');
    let validationFields = [];

    return {

      state() {
        return {
          driverForm: formPath,
          driverMeta: ['drivers', ...formPath]
        };
      },

      getValidationData() {
        return {
          fields: validationFields
        };
      },

      getBindings({ state, signals, t = null, props = {} }) {
        validationFields = [];

        const inputProps = function (name, {
          label = null,
          value = state.driverMeta && state.driverMeta[name] && state.driverMeta[name].inputValue,
          inputType = 'text',
          format = val => val === null ? '' : val,
          messages = {},
          validationType = 'string',
          required = false,
          signalData = {}
        } = {}) {
          const useInputValue = typeof value !== 'undefined' && value !== null;
          const validationKey = state.driverForm && state.driverForm.validation && state.driverForm.validation[name];
          const isError = !!validationKey;
          const formattedValue = state.driverForm && format(state.driverForm[name]);
          const displayValue = useInputValue ? value : formattedValue;
          const statePath = [...formPath, name];
          const signalInput = Object.assign({
            formName,
            name,
            displayValue,
            inputValueStatePath: ['drivers', ...statePath, 'inputValue'],
            validationKeyStatePath: [...formPath, 'validation', name],
            statePath,
            validationType,
            validationKeyPrefix: t ? name : '',
            required
          }, signalData);
          validationFields.push(signalInput);
          let message = '';
          if (isError) {
            if (t) {
              message = t[validationKey] ? t[validationKey]() : validationKey;
            } else {
              const key = validationKey.toLowerCase();
              message = messages[key] ? messages[key] : key;
            }
          } else if (useInputValue && formattedValue !== value) {
            message = formattedValue;
          }
          return Object.assign({
            label: label !== null
              ? label
              : (t || {})[name + 'Label']
                ? (t || {})[name + 'Label']()
                : name,
            value: displayValue,
            type: inputType,
            isError,
            message,
            onChange(e) {
              signals.driver.valuesChanged({
                fields: [
                  Object.assign({
                    inputValue: e.target.value
                  }, signalInput)
                ]
              });
            }
          }, props);
        };

        const inputTimeProps = function (name, options = {}) {
          const timeFormat = options.timeFormat ? options.timeFormat : 'H:mm';
          return inputProps(name, Object.assign({
            format: value => value === null ? '' : moment(value * 1000 * 60).utcOffset(0).format(timeFormat),
            validationType: 'time',
            signalData: { timeFormat }
          }, options));
        };

        const inputDateProps = function (name, options = {}) {
          const dateFormat = options.dateFormat ? options.dateFormat : 'L';
          return inputProps(name, Object.assign({
            format: value => value === null ? '' : moment(value).format(dateFormat),
            validationType: 'date',
            signalData: { dateFormat }
          }, options));
        };

        const inputIntProps = function (name, options = {}) {
          return inputProps(name, Object.assign({
            format: value => value === null ? '' : '' + value,
            validationType: 'int'
          }, options));
        };

        const inputEmailProps = function (name, options = {}) {
          return inputProps(name, Object.assign({
            validationType: 'email'
          }, options));
        };

        const inputPasswordProps = function (name, options = {}) {
          return inputProps(name, Object.assign({
            validationType: options.checkStrength ? 'password' : 'string',
            inputType: 'password'
          }, options));
        };

        const inputEqualsProps = function (name, compare, options = {}) {
          return inputProps(name, Object.assign({
            validationType: 'equal',
            signalData: { compare }
          }, options));
        };

        const menuOpenProps = function (name, {
          eventType = 'onTouchTap'
        } = {}) {
          const statePath = [...formPath, name];
          const driverPath = ['drivers', ...statePath];
          const isOpenPath = [...driverPath, 'isOpen'];
          const p = {};
          p[eventType] = () => signals.driver.isOpenChanged({
            statePath: isOpenPath,
            value: true
          });
          return Object.assign(p, props);
        };

        const menuProps = function (name) {
          const statePath = [...formPath, name];
          const driverPath = ['drivers', ...statePath];
          const isOpenPath = [...driverPath, 'isOpen'];
          return Object.assign({
            isOpen: !!(state.driverMeta && state.driverMeta[name] && state.driverMeta[name].isOpen),
            onClose() {
              signals.driver.isOpenChanged({
                statePath: isOpenPath,
                value: false
              });
            }
          }, props);
        };

        const selectProps = function (name, selectOptions, options = {}) {
          return Object.assign(
            { options: selectOptions },
            inputProps(name, Object.assign({
              value: null,
              validationType: 'none'
            }, options)),
            menuOpenProps(name, { eventType: 'onOpen' }),
            menuProps(name));
        };

        const checkboxProps = function (name, options = {}) {
          return inputProps(name, Object.assign({
            value: null,
            validationType: 'none'
          }, options));
        };

        return {
          checkboxProps,
          inputDateProps,
          inputEmailProps,
          inputEqualsProps,
          inputIntProps,
          inputPasswordProps,
          inputProps,
          inputTimeProps,
          menuOpenProps,
          menuProps,
          selectProps
        };
      }
    };
  }

};
