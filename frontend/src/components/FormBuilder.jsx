import React from 'react';
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
} from '@coreui/react';

const FormBuilder = ({
  title,
  fields,
  values,
  onChange,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  isLoading = false,
  layout = 'horizontal', // horizontal or vertical
  columns = 2, // Number of columns in horizontal layout
}) => {
  const renderField = (field) => {
    const {
      name,
      label,
      type = 'text',
      placeholder,
      options,
      required,
      disabled,
      readOnly,
      helpText,
      validation,
      ...rest
    } = field;

    const commonProps = {
      id: name,
      name,
      value: values[name] || '',
      onChange: (e) => onChange(name, e.target.value),
      required,
      disabled,
      readOnly,
      placeholder,
      ...rest,
    };

    switch (type) {
      case 'select':
        return (
          <CFormSelect {...commonProps}>
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
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
            checked={values[name] || false}
            onChange={(e) => onChange(name, e.target.checked)}
          />
        );

      case 'radio':
        return options.map((option) => (
          <CFormCheck
            key={option.value}
            type="radio"
            name={name}
            label={option.label}
            value={option.value}
            checked={values[name] === option.value}
            onChange={(e) => onChange(name, e.target.value)}
            {...rest}
          />
        ));

      default:
        return <CFormInput type={type} {...commonProps} />;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>{title}</strong>
      </CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          {layout === 'horizontal' ? (
            <CRow>
              {fields.map((field) => (
                <CCol key={field.name} sm={12} md={12 / columns}>
                  <div className="mb-3">
                    <CFormLabel htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-danger">*</span>}
                    </CFormLabel>
                    {renderField(field)}
                    {field.helpText && (
                      <div className="form-text">{field.helpText}</div>
                    )}
                  </div>
                </CCol>
              ))}
            </CRow>
          ) : (
            fields.map((field) => (
              <div key={field.name} className="mb-3">
                <CFormLabel htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-danger">*</span>}
                </CFormLabel>
                {renderField(field)}
                {field.helpText && (
                  <div className="form-text">{field.helpText}</div>
                )}
              </div>
            ))
          )}

          <div className="d-flex gap-2 justify-content-end">
            {onCancel && (
              <CButton
                color="secondary"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelText}
              </CButton>
            )}
            <CButton color="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Loading...' : submitText}
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default FormBuilder; 