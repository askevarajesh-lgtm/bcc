import React, { useState, useEffect, useMemo } from 'react';
import { Input, Select } from 'antd';
import { getCountries, getCountryCallingCode, validatePhoneNumberLength } from 'libphonenumber-js';

const { Option } = Select;

const getIsoFromCallingCode = (callingCode) => {
  if (!callingCode) return 'IN';
  if (callingCode === '91') return 'IN';
  if (callingCode === '1') return 'US';
  if (callingCode === '44') return 'GB';
  if (callingCode === '81') return 'JP';
  if (callingCode === '61') return 'AU';
  
  const countries = getCountries();
  for (const country of countries) {
    if (getCountryCallingCode(country) === callingCode) {
      return country;
    }
  }
  return 'IN';
};

const PhoneInput = ({
  value,
  onChange,
  countryCodeValue = '91',
  onCountryCodeChange,
  isoCountryValue,
  onCountryIsoChange,
  placeholder = "Enter phone number",
  ...props
}) => {
  const [internalIso, setInternalIso] = useState(isoCountryValue || 'IN');

  useEffect(() => {
    if (isoCountryValue) {
      setInternalIso(isoCountryValue);
    } else if (countryCodeValue) {
      const currentCallingCode = getCountryCallingCode(internalIso);
      if (currentCallingCode !== String(countryCodeValue)) {
        const newIso = getIsoFromCallingCode(String(countryCodeValue));
        setInternalIso(newIso);
        if (onCountryIsoChange) {
          onCountryIsoChange(newIso);
        }
      } else if (!isoCountryValue && onCountryIsoChange) {
         // Even if the calling code matches internalIso, but parent's isoCountryValue is empty, 
         // we should notify the parent of the current internalIso so the validator works.
         onCountryIsoChange(internalIso);
      }
    }
  }, [countryCodeValue, isoCountryValue, internalIso, onCountryIsoChange]);

  const countries = useMemo(() => getCountries(), []);
  
  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' });
    } catch (e) {
      return null;
    }
  }, []);

  const countryOptions = useMemo(() => {
    return countries.map(country => {
      const callingCode = getCountryCallingCode(country);
      const name = displayNames ? displayNames.of(country) : country;
      const flagOffset = 127397;
      const flag = country.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + flagOffset));

      return {
        value: country,
        callingCode,
        label: `${flag} ${name} (+${callingCode})`,
        searchString: `${name} +${callingCode} ${country}`.toLowerCase()
      };
    }).sort((a, b) => a.label.localeCompare(b.label));
  }, [countries, displayNames]);

  const handleCountryChange = (isoCode) => {
    setInternalIso(isoCode);
    const callingCode = getCountryCallingCode(isoCode);
    if (onCountryCodeChange) {
      onCountryCodeChange(callingCode);
    }
    if (onCountryIsoChange) {
      onCountryIsoChange(isoCode);
    }
  };

  const customHandlePhoneChange = (e) => {
    let inputValue = e.target.value;
    inputValue = inputValue.replace(/\D/g, '');
    
    if (inputValue.length > 0) {
        const lengthResult = validatePhoneNumberLength(inputValue, internalIso);
        if (lengthResult === 'TOO_LONG') {
          return;
        }
    }
    
    const syntheticEvent = {
       ...e,
       target: { ...e.target, value: inputValue }
    };
    
    if (onChange) {
       onChange(syntheticEvent);
    }
  };

  const selectBefore = (
    <Select
      showSearch
      value={internalIso}
      onChange={handleCountryChange}
      style={{ width: 120 }}
      popupMatchSelectWidth={false}
      filterOption={(input, option) => {
        const searchInput = input.toLowerCase();
        return option.searchString.includes(searchInput);
      }}
    >
      {countryOptions.map(opt => (
        <Option key={opt.value} value={opt.value} searchString={opt.searchString}>
          {opt.label}
        </Option>
      ))}
    </Select>
  );

  return (
    <Input
      {...props}
      type="tel"
      value={value}
      onChange={customHandlePhoneChange}
      placeholder={placeholder}
      addonBefore={selectBefore}
    />
  );
};

export default PhoneInput;
