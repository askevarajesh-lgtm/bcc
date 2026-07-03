import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, message, Button, AutoComplete } from 'antd';
import { hrmsService } from '../../../../services/hrms.service';

const { Option } = Select;

const AddEmployeeModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchOptions();
    } else {
      form.resetFields();
    }
  }, [visible, form]);

  const fetchOptions = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        hrmsService.getDepartments(),
        hrmsService.getDesignations()
      ]);
      if (deptRes.success) setDepartments(deptRes.data);
      if (desigRes.success) setDesignations(desigRes.data);
    } catch (error) {
      message.error('Failed to load departments/designations');
    }
  };

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        joiningDate: values.joiningDate.toDate(),
      };
      
      const res = await hrmsService.createEmployee(payload);
      if (res.success) {
        message.success('Employee created successfully');
        onSuccess();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<h2 style={{ margin: 0, fontWeight: 800 }}>Add New Employee</h2>}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      bodyStyle={{ padding: '24px 24px 0 24px' }}
      className="glassmorphism-modal"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="employeeCode" label="Employee Code" rules={[{ required: true }]}>
              <Input placeholder="e.g. EMP-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="employee@company.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
              <Input placeholder="John" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
              <Input placeholder="Doe" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="departmentId" label="Department" rules={[{ required: true }]}>
              <AutoComplete 
                placeholder="Type or select a department"
                options={departments.map(d => ({ value: d.name, label: d.name }))}
                filterOption={(inputValue, option) => option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="designationId" label="Designation" rules={[{ required: true }]}>
              <AutoComplete 
                placeholder="Type or select a designation"
                options={designations.map(d => ({ value: d.title, label: d.title }))}
                filterOption={(inputValue, option) => option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="employmentType" label="Employment Type" initialValue="Full Time">
              <Select>
                <Option value="Full Time">Full Time</Option>
                <Option value="Part Time">Part Time</Option>
                <Option value="Contract">Contract</Option>
                <Option value="Intern">Intern</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="joiningDate" label="Joining Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingBottom: 24 }}>
          <Button onClick={onCancel} style={{ borderRadius: 8 }}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ background: 'var(--accent-warning)', borderRadius: 8, fontWeight: 600 }}>
            Create Employee
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddEmployeeModal;
