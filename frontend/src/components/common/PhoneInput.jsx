import React from 'react';
import { Input } from 'antd';

const PhoneInput = (props) => {
  return (
    <Input
      {...props}
      type="tel"
      placeholder={props.placeholder || "Enter phone number"}
    />
  );
};

export default PhoneInput;
