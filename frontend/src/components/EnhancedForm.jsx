import React, { useState } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CFormCheck,
  CButton,
  CRow,
  CCol,
  CAlert,
  CFormFeedback,
  CSpinner,
  CInputGroup,
  CFormText,
  CTooltip,
  CCardFooter
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilInfo, cilX, cilSave, cilCog } from '@coreui/icons';

const EnhancedForm = ({
  title,
  fields = [],
  values = {},
  onChange,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  isLoading = false,
  layout = 'horizontal', // horizontal or vertical
  columns = 2, // Number of columns in horizontal layout
  errors = {}, // Form validation errors
  successMessage = '',
  errorMessage = '',
  resetAfterSubmit = false,
  submitButtonProps = {},
  cancelButtonProps = {},
  fieldSpacing = 3, // Bootstrap spacing (mb-3)
  showValidationFeedback = true,
  formRef = null,
  showRequiredFieldsNote = true,
  extraActions = null, // Optional extra buttons/actions in the footer
  customButtons = null, // Complete custom footer actions
}) => {
  const [touched, setTouched] = useState({});
  const [localValues, setLocalValues] = useState(values);
  
  // Handle field change
  const handleChange = (name, value, options = {}) => {
    console.log(`EnhancedForm handleChange called for field ${name} with value:`, value);
    
    const newValues = { ...localValues, [name]: value };
    setLocalValues(newValues);
    
    // Mark field as touched if not already
    if (!touched[name]) {
      setTouched({ ...touched, [name]: true });
    }
    
    // Call parent onChange handler
    if (onChange) {
      // If this is triggered by a field with its own onChange handler
      if (options && options.callback) {
        console.log(`Calling onChange callback for field ${name} with value:`, value);
        
        // Call the field's onChange with appropriate parameters
        // Need to pass name, value, and extra data including formValues and setFieldOptions
        const setFieldOptionsFunc = (fieldName, options) => {
          console.log(`Setting options for field ${fieldName}:`, options);
          // Find the field
          const fieldToUpdate = fields.find(f => f.name === fieldName);
          if (fieldToUpdate) {
            // Update the field's options
            fieldToUpdate.options = [...options]; // Create a new array to ensure React detects the change
            // Force a rerender with the current values preserved
            setLocalValues(prevValues => ({...prevValues}));
          }
        };
        
        const result = options.callback(name, value, {
          formValues: newValues,
          setFieldOptions: setFieldOptionsFunc
        });
        
        // If the field's onChange returns updates to apply to other fields
        if (result && typeof result === 'object') {
          console.log(`Field ${name} onChange returned updates:`, result);
          const updatedValues = { ...newValues, ...result };
          console.log("Setting updated values:", updatedValues);
          setLocalValues(updatedValues);
          // Also call parent onChange with the updated values
          onChange(name, value, updatedValues);
          return;
        }
      }
      
      // Standard call to parent onChange
      console.log("Calling parent onChange with values:", newValues);
      onChange(name, value, newValues, options);
    }
    
    // Handle dependent fields (e.g., when one field's value affects another)
    if (options.dependencies) {
      options.dependencies.forEach(dependency => {
        const { field, getValue } = dependency;
        if (field && getValue) {
          const dependentValue = getValue(value, newValues);
          handleChange(field, dependentValue);
        }
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    const allTouched = fields.reduce((acc, field) => {
      acc[field.name] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    // Submit if valid
    const isValid = !Object.keys(errors).length;
    
    if (isValid && onSubmit) {
      const result = await onSubmit(localValues);
      
      // Reset form if specified and submission was successful
      if (resetAfterSubmit && result !== false) {
        const initialValues = fields.reduce((acc, field) => {
          acc[field.name] = field.defaultValue || '';
          return acc;
        }, {});
        
        setLocalValues(initialValues);
        setTouched({});
      }
    }
  };

  const getFieldLayout = (field) => {
    // Determine column span based on field's colSpan prop or default
    let colSpan = field.colSpan || 1;
    if (colSpan > columns) colSpan = columns;
    
    return {
      xs: 12, // Full width on smallest screens
      md: colSpan === columns ? 12 : 12 / columns * colSpan
    };
  };

  const renderField = (field) => {
    const {
      name,
      label,
      type = 'text',
      placeholder,
      options = [],
      required,
      disabled,
      readOnly,
      helpText,
      tooltip,
      className = '',
      hidden,
      min,
      max,
      step,
      autoComplete,
      prefix,
      suffix,
      labelProps = {},
      inputProps = {},
      formatter, // Function to format display value
      parser, // Function to parse input value back to stored value
      ...rest
    } = field;

    // Don't render hidden fields
    if (hidden) return null;

    const isInvalid = touched[name] && errors[name];
    const isValid = touched[name] && !errors[name];
    
    // Common props for all input types
    const commonProps = {
      id: `form-${name}`,
      name,
      value: localValues[name] !== undefined ? localValues[name] : '',
      onChange: (e) => {
        const value = e.target?.type === 'checkbox' 
          ? e.target.checked 
          : parser ? parser(e.target.value) : e.target.value;
        
        // Pass the field's onChange as a callback, if it exists
        handleChange(name, value, field.onChange ? { callback: field.onChange } : {});
      },
      required,
      // Check both disabled and disabledIf props
      disabled: disabled || (field.disabledIf && typeof field.disabledIf === 'function' ? field.disabledIf(localValues) : false) || isLoading,
      readOnly,
      placeholder,
      invalid: !!isInvalid,
      valid: !!isValid,
      autoComplete,
      ...inputProps,
      ...rest,
    };

    const inputField = (() => {
      switch (type) {
        case 'select':
          return (
            <CFormSelect {...commonProps}>
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((option, index) => (
                <option 
                  key={`${option.value || index}`} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </CFormSelect>
          );

        case 'textarea':
          return <CFormTextarea rows={3} {...commonProps} />;

        case 'checkbox':
          return (
            <CFormCheck
              {...commonProps}
              checked={!!localValues[name]}
              label={label}
            />
          );

        case 'radio':
          return (
            <div className="pt-1">
              {options.map((option, idx) => (
                <CFormCheck
                  key={`${name}-${idx}`}
                  type="radio"
                  name={name}
                  id={`${name}-${option.value || idx}`}
                  label={option.label}
                  value={option.value}
                  checked={localValues[name] === option.value}
                  onChange={() => handleChange(name, option.value)}
                  disabled={disabled || option.disabled || isLoading}
                  invalid={!!isInvalid}
                  valid={!!isValid}
                  {...rest}
                />
              ))}
            </div>
          );

        case 'date':
        case 'datetime-local':
        case 'time':
        case 'number':
        case 'email':
        case 'password':
        case 'tel':
        case 'url':
          return <CFormInput type={type} min={min} max={max} step={step} {...commonProps} />;
          
        default: // text input
          const displayValue = formatter && localValues[name] ? formatter(localValues[name]) : localValues[name];
          
          return prefix || suffix ? (
            <CInputGroup>
              {prefix && <CInputGroup.Text>{prefix}</CInputGroup.Text>}
              <CFormInput type="text" value={displayValue || ''} {...commonProps} />
              {suffix && <CInputGroup.Text>{suffix}</CInputGroup.Text>}
            </CInputGroup>
          ) : (
            <CFormInput type="text" value={displayValue || ''} {...commonProps} />
          );
      }
    })();

    // Checkbox is a special case because the label is part of the component itself
    if (type === 'checkbox') {
      return (
        <div className={`mb-${fieldSpacing} ${className}`}>
          {inputField}
          {helpText && <CFormText>{helpText}</CFormText>}
          {isInvalid && showValidationFeedback && <CFormFeedback invalid>{errors[name]}</CFormFeedback>}
        </div>
      );
    }

    return (
      <div className={`mb-${fieldSpacing} ${className}`}>
        {label && type !== 'checkbox' && (
          <CFormLabel htmlFor={`form-${name}`} {...labelProps}>
            {label}
            {required && <span className="ms-1 text-danger">*</span>}
            {tooltip && (
              <CTooltip content={tooltip}>
                <CIcon icon={cilInfo} size="sm" className="ms-2 text-info" />
              </CTooltip>
            )}
          </CFormLabel>
        )}
        {inputField}
        {helpText && <CFormText>{helpText}</CFormText>}
        {isInvalid && showValidationFeedback && <CFormFeedback invalid>{errors[name]}</CFormFeedback>}
      </div>
    );
  };

  return (
    <CCard className="mb-4 shadow-sm">
      {title && (
        <CCardHeader>
          <strong>{title}</strong>
        </CCardHeader>
      )}
      <CCardBody>
        {(successMessage || errorMessage) && (
          <div className="mb-3">
            {successMessage && (
              <CAlert color="success" dismissible>
                {successMessage}
              </CAlert>
            )}
            {errorMessage && (
              <CAlert color="danger" dismissible>
                {errorMessage}
              </CAlert>
            )}
          </div>
        )}
        
        <CForm onSubmit={handleSubmit} ref={formRef}>
          {layout === 'horizontal' ? (
            <CRow>
              {fields.map((field) => (
                <CCol key={field.name} {...getFieldLayout(field)}>
                  {renderField(field)}
                </CCol>
              ))}
            </CRow>
          ) : (
            fields.map((field) => (
              <div key={field.name}>{renderField(field)}</div>
            ))
          )}
          
          {showRequiredFieldsNote && fields.some(field => field.required) && (
            <div className="mb-3">
              <small className="text-muted">
                <span className="text-danger">*</span> Required fields
              </small>
            </div>
          )}
        </CForm>
      </CCardBody>
      
      <CCardFooter className="d-flex justify-content-end gap-2">
        {customButtons || (
          <>
            {extraActions}
            {onCancel && (
              <CButton
                color="secondary"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                {...cancelButtonProps}
              >
                <CIcon icon={cilX} className="me-1" />
                {cancelText}
              </CButton>
            )}
            <CButton 
              color="primary"
              onClick={handleSubmit}
              disabled={isLoading}
              {...submitButtonProps}
            >
              {isLoading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CIcon icon={cilSave} className="me-1" />
                  {submitText}
                </>
              )}
            </CButton>
          </>
        )}
      </CCardFooter>
    </CCard>
  );
};

export default EnhancedForm; 