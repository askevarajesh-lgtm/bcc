
module.exports = {
  buildDropdownOptions: (items, labelField, valueField) =>
    (items || []).map(i => ({ label: i[labelField], value: i[valueField] || i._id })),
};
