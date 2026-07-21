import React, { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Select, Button, Space, Descriptions, Tag, message, Row, Col, Switch, Divider } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Typography } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ProposalForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = !!id;

  const [form] = Form.useForm();
  const [clients, setClients] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const selectedMasterItemId = Form.useWatch('masterItems', form);
  const selectedMasterItem = masterItems.find(item => item._id === selectedMasterItemId);

  useEffect(() => {
    fetchClients();
    fetchMasterItems();
    if (isEditing) {
      fetchProposal();
    }
  }, [id, isEditing]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/proposals/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const proposal = data.data;
        form.setFieldsValue({
          name: proposal.name,
          clientId: proposal.clientId?._id || proposal.clientId,
          masterItems: proposal.masterItems?.[0]?._id || proposal.masterItems?.[0],
          grandTotal: proposal.grandTotal,
          notes: proposal.notes
        });

        // Ensure custom master item is in the options list
        if (proposal.masterItems?.[0] && typeof proposal.masterItems[0] === 'object') {
          setMasterItems(prev => {
            if (!prev.find(i => i._id === proposal.masterItems[0]._id)) {
              return [...prev, proposal.masterItems[0]];
            }
            return prev;
          });
          if (proposal.masterItems[0].isCustom) {
             setIsCustomizing(true);
             const item = proposal.masterItems[0];
             const categories = item.categories?.map(c => c.name) || [];
             const categoryCounts = {};
             item.categories?.forEach(c => { categoryCounts[c.name] = c.count; });
             form.setFieldsValue({
               customName: item.name,
               customDescription: item.description,
               customPrice: item.price,
               customCategories: categories,
               customCategoryCounts: categoryCounts,
               customApplicableAccess: item.applicableAccess || [],
               customHandlingDuration: item.handlingDuration
             });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMasterItem) {
      form.setFieldsValue({ grandTotal: selectedMasterItem.price });
    }
  }, [selectedMasterItem, form]);

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

  const fetchMasterItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/master-items', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMasterItems(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch master items:', error);
    }
  };

  const getBaseRoute = () => {
    if (location.pathname.startsWith("/client")) return "/client/workspace";
    if (location.pathname.startsWith("/agency")) return "/agency";
    if (location.pathname.startsWith("/user")) return "/user/workspace";
    return "/workspace";
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const payload = {
        name: values.name,
        clientId: values.clientId,
        masterItems: [values.masterItems], // Backend expects array
        subtotal: values.grandTotal, // Mirror total
        grandTotal: values.grandTotal,
        notes: values.notes,
        status: 'Draft'
      };

      if (isCustomizing) {
        const formattedCategories = (values.customCategories || []).map(catName => ({
          name: catName,
          count: values.customCategoryCounts?.[catName] || 0
        }));
        payload.customMasterItem = {
          name: values.customName,
          description: values.customDescription,
          price: values.customPrice,
          handlingDuration: values.customHandlingDuration,
          status: 'active',
          categories: formattedCategories,
          applicableAccess: values.customApplicableAccess || []
        };
      }

      const url = isEditing ? `/api/proposals/${id}` : '/api/proposals';
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
        message.success(`Proposal ${isEditing ? 'updated' : 'created'} successfully`);
        navigate(`${getBaseRoute()}/proposals`);
      } else {
        message.error(data.message || "Operation failed");
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
        <Title level={3} style={{ margin: 0 }}>{isEditing ? "Edit Proposal" : "Create Proposal"}</Title>
        <Button onClick={() => navigate(`${getBaseRoute()}/proposals`)}>Back</Button>
      </div>
      <Card loading={loading}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Proposal Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Q3 SEO Campaign" />
          </Form.Item>
          
          <Form.Item label="Client" name="clientId" rules={[{ required: true }]}>
            <Select placeholder="Select Client" loading={clients.length === 0} showSearch optionFilterProp="children">
              {clients.map(c => (
                <Option key={c._id} value={c._id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item label="Master Item" name="masterItems" rules={[{ required: true }]}>
            <Select placeholder="Select Master Item" loading={masterItems.length === 0} showSearch optionFilterProp="children">
              {masterItems.map(item => (
                <Option key={item._id} value={item._id}>{item.name}</Option>
              ))}
            </Select>
          </Form.Item>

          {selectedMasterItem && !isCustomizing && (
            <div style={{ marginBottom: 24, padding: 24, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Package Details: {selectedMasterItem.name}</span>
                <Switch checked={isCustomizing} onChange={(checked) => {
                  setIsCustomizing(checked);
                  if (checked && !form.getFieldValue('customName')) {
                    const categories = selectedMasterItem.categories?.map(c => c.name) || [];
                    const categoryCounts = {};
                    selectedMasterItem.categories?.forEach(c => { categoryCounts[c.name] = c.count; });
                    form.setFieldsValue({
                      customName: selectedMasterItem.name,
                      customDescription: selectedMasterItem.description,
                      customPrice: selectedMasterItem.price,
                      customCategories: categories,
                      customCategoryCounts: categoryCounts,
                      customApplicableAccess: selectedMasterItem.applicableAccess || [],
                      customHandlingDuration: selectedMasterItem.handlingDuration
                    });
                  }
                }} checkedChildren="Custom" unCheckedChildren="Original" />
              </div>
              <Descriptions bordered size="small" column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                <Descriptions.Item label="Description" span={2}>
                  {selectedMasterItem.description || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Item Type">
                  <Tag>PACKAGE</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Pricing Model">
                  <Tag color="blue">FIXED</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Base Price">
                  ₹{selectedMasterItem.price?.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount">
                  ₹{selectedMasterItem.price?.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={selectedMasterItem.status === 'active' ? 'green' : 'red'}>
                    {selectedMasterItem.status?.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Handling Duration">
                  {selectedMasterItem.handlingDuration || 'N/A'}
                </Descriptions.Item>
                
                {selectedMasterItem.categories?.map((cat, index) => (
                  <Descriptions.Item key={cat._id || index} label={`Number of ${cat.name}`}>
                    {cat.count}
                  </Descriptions.Item>
                ))}

                <Descriptions.Item label="Categories">
                  {selectedMasterItem.categories?.map((cat, index) => <Tag key={cat._id || index} color="purple">{cat.name}</Tag>)}
                </Descriptions.Item>

                {selectedMasterItem.applicableAccess?.length > 0 && (
                  <Descriptions.Item label="Applicable Access / Deliverables" span={2}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {selectedMasterItem.applicableAccess.map((access, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 4 }}>
                          <Text strong>{access.name}</Text>
                          <Text>{access.value}</Text>
                        </div>
                      ))}
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          )}

          {selectedMasterItem && isCustomizing && (
            <div style={{ marginBottom: 24, padding: 24, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Customize Package: {selectedMasterItem.name}</span>
                <Switch checked={isCustomizing} onChange={(checked) => setIsCustomizing(checked)} checkedChildren="Custom" unCheckedChildren="Original" />
              </div>

              <Form.Item label="Item Name" name="customName" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              
              <Form.Item label="Select Categories" name="customCategories">
                <Select mode="tags" style={{ width: '100%' }} placeholder="Select or type categories" />
              </Form.Item>

              <Form.Item noStyle dependencies={['customCategories']}>
                {({ getFieldValue }) => {
                  const cats = getFieldValue('customCategories') || [];
                  return cats.length > 0 ? (
                    <div style={{ marginBottom: 24, paddingLeft: 16 }}>
                      {cats.map((cat) => (
                        <Row key={cat} style={{ marginBottom: 16 }} align="middle" gutter={16}>
                          <Col span={6}><Text strong>{cat}</Text></Col>
                          <Col span={18}>
                            <Form.Item label={`Number of ${cat}`} name={['customCategoryCounts', cat]} initialValue={0} style={{ marginBottom: 0 }}>
                              <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                          </Col>
                        </Row>
                      ))}
                    </div>
                  ) : null;
                }}
              </Form.Item>

              <Divider orientation="left">Applicable Access / Deliverables</Divider>
              <Form.List name="customApplicableAccess">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          rules={[{ required: true, message: 'Missing access name' }]}
                        >
                          <Input placeholder="Access Name (e.g., Website Maintenance)" style={{ width: 300 }} />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'value']}
                          rules={[{ required: true, message: 'Missing value' }]}
                        >
                          <Input placeholder="Value (e.g., Yes, Monthly, 1)" style={{ width: 200 }} />
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                      </Space>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Applicable Access Item
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>

              <Form.Item label="Description" name="customDescription">
                <Input.TextArea rows={4} />
              </Form.Item>

              <Form.Item label="Service Price" name="customPrice" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} prefix="₹" min={0} onChange={val => form.setFieldsValue({ grandTotal: val })} />
              </Form.Item>

              <Form.Item label="Handling Duration" name="customHandlingDuration">
                <Select>
                  <Option value="1 Week">1 Week</Option>
                  <Option value="15 Days">15 Days</Option>
                  <Option value="1 Month">1 Month</Option>
                  <Option value="2 Months">2 Months</Option>
                  <Option value="3 Months">3 Months</Option>
                  <Option value="6 Months">6 Months</Option>
                  <Option value="1 Year">1 Year</Option>
                </Select>
              </Form.Item>
            </div>
          )}

          <Form.Item label="Total Amount" name="grandTotal" rules={[{ required: true }]}>
            <InputNumber 
              style={{ width: '100%' }} 
              prefix="₹" 
              disabled 
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={4} placeholder="Add any additional notes for the client..." />
          </Form.Item>

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
            <Button onClick={() => navigate(`${getBaseRoute()}/proposals`)} disabled={loading}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default ProposalForm;
