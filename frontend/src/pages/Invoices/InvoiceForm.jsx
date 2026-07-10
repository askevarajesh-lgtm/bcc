import React, { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Select, Button, Space, Descriptions, Tag, message, DatePicker } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Typography } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const InvoiceForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = !!id;

  const [form] = Form.useForm();
  const [clients, setClients] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedClientId = Form.useWatch('clientId', form);
  const selectedProposalId = Form.useWatch('proposalId', form);
  
  const filteredProposals = proposals.filter(p => {
    const pClientId = p.clientId?._id || p.clientId;
    return pClientId === selectedClientId;
  });

  const selectedProposal = proposals.find(p => p._id === selectedProposalId);

  useEffect(() => {
    fetchClients();
    fetchProposals();
    if (isEditing) {
      fetchInvoice();
    }
  }, [id, isEditing]);

  // When client changes, clear the proposal selection if it doesn't belong to the new client
  useEffect(() => {
    if (selectedClientId && selectedProposal) {
      const pClientId = selectedProposal.clientId?._id || selectedProposal.clientId;
      if (pClientId !== selectedClientId) {
        form.setFieldsValue({ proposalId: undefined, grandTotal: undefined });
      }
    }
  }, [selectedClientId]);

  // When proposal is selected, auto-fill the grand total
  useEffect(() => {
    if (selectedProposal) {
      form.setFieldsValue({ grandTotal: selectedProposal.grandTotal });
    }
  }, [selectedProposal, form]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/invoices/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const invoice = data.data;
        form.setFieldsValue({
          clientId: invoice.clientId?._id || invoice.clientId,
          proposalId: invoice.proposalId?._id || invoice.proposalId,
          invoiceNumber: invoice.invoiceNumber,
          paymentMode: invoice.paymentMode,
          dueDate: invoice.dueDate ? dayjs(invoice.dueDate) : undefined,
          invoiceDate: invoice.createdAt ? dayjs(invoice.createdAt) : dayjs(),
          grandTotal: invoice.grandTotal,
          notes: invoice.notes
        });
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/brands', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchProposals = async () => {
    try {
      const token = localStorage.getItem("token");
      // Fetch all proposals to filter on the frontend
      const res = await fetch('/api/proposals?limit=1000', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProposals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    }
  };

  const getBaseRoute = () => {
    if (location.pathname.startsWith("/client")) return "/client/workspace";
    if (location.pathname.startsWith("/agency")) return "/agency";
    if (location.pathname.startsWith("/user")) return "/user/workspace";
    return "/workspace";
  };

  const onFinish = async (values, status) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const payload = {
        clientId: values.clientId,
        proposalId: values.proposalId,
        invoiceNumber: values.invoiceNumber || undefined, // undefined allows backend to auto-generate
        paymentMode: values.paymentMode,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        amount: values.grandTotal,
        subtotal: values.grandTotal, 
        tax: 0,
        discount: 0,
        grandTotal: values.grandTotal,
        notes: values.notes,
        paymentStatus: 'Pending',
        invoiceStatus: status // 'Sent' or 'Draft'
      };

      const url = isEditing ? `/api/invoices/${id}` : '/api/invoices';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        message.success(`Invoice ${isEditing ? 'updated' : 'created'} successfully`);
        navigate(`${getBaseRoute()}/invoices`);
      } else {
        message.error(data.message || data.error || "Operation failed");
      }
    } catch (error) {
      console.error(error);
      message.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>{isEditing ? "Edit Invoice" : "Create Invoice"}</Title>
        <Button onClick={() => navigate(`${getBaseRoute()}/invoices`)}>Back</Button>
      </div>
      <Card loading={loading}>
        <Form form={form} layout="vertical" initialValues={{ invoiceDate: dayjs() }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="Client" name="clientId" rules={[{ required: true, message: 'Client is required' }]}>
              <Select placeholder="Select Client" loading={clients.length === 0} showSearch optionFilterProp="children">
                {clients.map(c => (
                  <Option key={c._id} value={c._id}>{c.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Proposal" name="proposalId" rules={[{ required: true, message: 'Proposal is required' }]}>
              <Select placeholder="Select Proposal" disabled={!selectedClientId} loading={proposals.length === 0} showSearch optionFilterProp="children" allowClear>
                {filteredProposals.map(p => (
                  <Option key={p._id} value={p._id}>{p.proposalNumber} - {p.name || 'Proposal'}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="Invoice Number" name="invoiceNumber" extra="Leave blank to auto-generate">
              <Input placeholder="INV-0001" />
            </Form.Item>
            
            <Form.Item label="Payment Type" name="paymentMode" rules={[{ required: true, message: 'Payment Type is required' }]}>
              <Select placeholder="Select Payment Type">
                <Option value="Prepaid">Prepaid</Option>
                <Option value="Postpaid">Postpaid</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="Invoice Date" name="invoiceDate" rules={[{ required: true, message: 'Invoice Date is required' }]}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item label="Due Date" name="dueDate" rules={[{ required: true, message: 'Due Date is required' }]}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </div>

          {selectedProposal && selectedProposal.masterItems?.map((item, idx) => (
            <div key={item._id || idx} style={{ marginBottom: 24, padding: 24, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>
                Package Details: {item.name}
              </div>
              <Descriptions bordered size="small" column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                <Descriptions.Item label="Description" span={2}>
                  {item.description || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Item Type">
                  <Tag>PACKAGE</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Pricing Model">
                  <Tag color="blue">FIXED</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Base Price">
                  ₹{item.price?.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount">
                  ₹{item.price?.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={item.status === 'active' ? 'green' : 'red'}>
                    {item.status?.toUpperCase() || 'ACTIVE'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Handling Duration">
                  1 Month
                </Descriptions.Item>
                
                {item.categories?.map((cat, index) => (
                  <Descriptions.Item key={cat._id || index} label={`Number of ${cat.name}`}>
                    {cat.count}
                  </Descriptions.Item>
                ))}

                <Descriptions.Item label="Categories">
                  {item.categories?.map((cat, index) => <Tag key={cat._id || index} color="purple">{cat.name}</Tag>)}
                  {(!item.categories || item.categories.length === 0) && 'No categories'}
                </Descriptions.Item>
              </Descriptions>
            </div>
          ))}

          <Form.Item label="Total Amount" name="grandTotal" rules={[{ required: true, message: 'Total Amount is required' }]}>
            <InputNumber 
              style={{ width: '100%' }} 
              prefix="₹" 
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={4} placeholder="Add any additional notes for the client..." />
          </Form.Item>

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => form.validateFields().then(v => onFinish(v, 'Sent'))} loading={loading}>Save (Sent)</Button>
            <Button onClick={() => form.validateFields().then(v => onFinish(v, 'Draft'))} loading={loading}>Save as Draft</Button>
            <Button onClick={() => navigate(`${getBaseRoute()}/invoices`)} disabled={loading} type="text">Cancel</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default InvoiceForm;
