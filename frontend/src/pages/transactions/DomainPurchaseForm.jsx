import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Space,
  message,
  Upload,
  Radio,
  Divider,
  Tag,
} from "antd";
import { UploadOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";
import {
  useCreateDomainPurchaseMutation,
  useUpdateDomainPurchaseMutation,
  useGetDomainPurchaseByIdQuery,
} from "../../api/domainPurchaseApi";
import {
  useGetCompaniesDropdownQuery,
  useGetCompanyByIdQuery,
  useCreateCompanyMutation,
} from "../../api/companyApi";
import { useGetTaxSettingsQuery } from "../../api/taxSettingsApi";
import dayjs from "dayjs";
import PhoneInput from "../../components/common/PhoneInput";

const { Option } = Select;
const { TextArea } = Input;

const DomainPurchaseForm = ({
  visible,
  onCancel,
  domainPurchaseId,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!domainPurchaseId;
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [contactCountryCode, setContactCountryCode] = useState("91");
  // New client flow state
  const [clientMode, setClientMode] = useState("existing"); // "existing" | "new"
  const [newClientCountryCode, setNewClientCountryCode] = useState("91");

  const { data: domainPurchaseData } = useGetDomainPurchaseByIdQuery(
    domainPurchaseId,
    { skip: !isEdit },
  );
  const { data: companiesData } = useGetCompaniesDropdownQuery({
    search: companySearch,
    limit: 50,
  });
  const companies = companiesData?.data || companiesData?.companies || [];
  console.log("DomainPurchaseForm companiesData:", companiesData, "companies:", companies);

  const { data: selectedCompanyData } = useGetCompanyByIdQuery(
    selectedCompanyId,
    { skip: !selectedCompanyId },
  );
  const selectedCompany = selectedCompanyData?.data?.company;

  const { data: taxSettingsData } = useGetTaxSettingsQuery();
  const taxSettings = taxSettingsData?.data?.settings;
  const defaultGst = taxSettings?.defaultGst || 18;
  const sellerAddress = taxSettings?.sellerDetails?.address;

  const [createDomainPurchase, { isLoading: isCreating }] =
    useCreateDomainPurchaseMutation();
  const [updateDomainPurchase, { isLoading: isUpdating }] =
    useUpdateDomainPurchaseMutation();
  const [createCompany, { isLoading: isCreatingClient }] =
    useCreateCompanyMutation();

  const calculateGstPercentage = useMemo(() => {
    if (!sellerAddress?.stateCode || !taxSettings) {
      return { percentage: 0, type: "no_tax", label: "No Tax" };
    }
    const clientAddress = selectedCompany?.address;
    if (!clientAddress || typeof clientAddress !== "object") {
      return { percentage: 0, type: "no_tax", label: "No Tax (Client Address Missing)" };
    }
    const clientStateCode = clientAddress.stateCode;
    const clientCountry = clientAddress.country || "India";
    const sellerStateCode = sellerAddress.stateCode;
    const sellerCountry = sellerAddress.country || "India";
    if (clientCountry.trim().toLowerCase() !== sellerCountry.trim().toLowerCase()) {
      return { percentage: 0, type: "no_tax", label: "No Tax (Different Country)" };
    }
    if (!clientStateCode || clientStateCode.trim() === "") {
      return { percentage: 0, type: "no_tax", label: "No Tax (State Code Missing)" };
    }
    if (clientStateCode.trim() === sellerStateCode.trim()) {
      return {
        percentage: defaultGst,
        type: "cgst_sgst",
        label: `CGST+SGST (${defaultGst}%)`,
        cgstPercent: defaultGst / 2,
        sgstPercent: defaultGst / 2,
      };
    } else {
      return {
        percentage: defaultGst,
        type: "igst",
        label: `IGST (${defaultGst}%)`,
        igstPercent: defaultGst,
      };
    }
  }, [selectedCompany, sellerAddress, taxSettings, defaultGst]);

  const gstInfo = calculateGstPercentage;
  const taxEnabled = gstInfo.percentage > 0 && taxSettings && sellerAddress?.stateCode;
  const taxPercentage = gstInfo.percentage;

  const paidAmount = Form.useWatch("paidAmount", form);
  const companyId = Form.useWatch("companyId", form);

  useEffect(() => {
    if (companyId && companyId !== selectedCompanyId) {
      setSelectedCompanyId(companyId);
    }
  }, [companyId, selectedCompanyId]);

  // Auto-fill Contact Number when an existing company is selected
  useEffect(() => {
    if (selectedCompany && clientMode === "existing") {
      const phone = selectedCompany.phone
        ? String(selectedCompany.phone).replace(/\D/g, "")
        : "";
      if (phone) {
        form.setFieldsValue({ contactNumber: phone });
        if (selectedCompany.countryCode) {
          setContactCountryCode(selectedCompany.countryCode);
        }
      }
    }
  }, [selectedCompany, clientMode, form]);

  useEffect(() => {
    if (paidAmount && paidAmount > 0 && taxEnabled && taxPercentage > 0) {
      const gstAmount = (paidAmount * taxPercentage) / 100;
      form.setFieldsValue({ gst: parseFloat(gstAmount.toFixed(2)) });
    } else if (!paidAmount || paidAmount === 0) {
      form.setFieldsValue({ gst: 0 });
    } else if (!taxEnabled || taxPercentage === 0) {
      form.setFieldsValue({ gst: 0 });
    }
  }, [paidAmount, taxEnabled, taxPercentage, selectedCompany, form]);

  useEffect(() => {
    if (domainPurchaseData?.data?.domainPurchase && isEdit) {
      const dp = domainPurchaseData.data.domainPurchase;
      const companyIdValue = dp.companyId?._id || dp.companyId;
      form.setFieldsValue({
        companyId: companyIdValue,
        contactPerson: dp.contactPerson,
        contactNumber: dp.contactNumber,
        domainName: dp.domainName,
        expiryDate: dp.expiryDate ? dayjs(dp.expiryDate) : null,
        product: dp.product,
        paidAmount: dp.paidAmount,
        balance: dp.balance,
        paymentDate: dp.paymentDate ? dayjs(dp.paymentDate) : dayjs(),
        gst: dp.gst,
        paymentDetail: dp.paymentDetail,
        paymentRemarks: dp.paymentRemarks,
      });
      if (dp.contactCountryCode) {
        setContactCountryCode(dp.contactCountryCode);
      } else {
        setContactCountryCode("91");
      }
      if (companyIdValue) {
        setSelectedCompanyId(companyIdValue);
      }
      if (dp.paymentScreenshotUrl) {
        setFileList([
          {
            uid: "-1",
            name: "Current Screenshot",
            status: "done",
            url: dp.paymentScreenshotUrl,
          },
        ]);
      } else {
        setFileList([]);
      }
      setScreenshotFile(null);
    } else if (!isEdit && visible) {
      form.resetFields();
      form.setFieldsValue({ paymentDate: dayjs() });
      setSelectedCompanyId(null);
      setClientMode("existing");
      setNewClientCountryCode("91");
      setScreenshotFile(null);
      setFileList([]);
      setContactCountryCode("91");
      setCompanySearch("");
    }
  }, [domainPurchaseData, isEdit, form, visible]);

  const handleModeChange = (e) => {
    setClientMode(e.target.value);
    // Clear company-related fields when switching mode
    form.setFieldsValue({
      companyId: undefined,
      newClientName: undefined,
      newClientEmail: undefined,
      newClientPhone: undefined,
    });
    setSelectedCompanyId(null);
  };

  const handleSubmit = async (values) => {
    try {
      let resolvedCompanyId = values.companyId;

      // If creating a new client, create the company first
      if (clientMode === "new") {
        const newName = (values.newClientName || "").trim();
        const newEmail = (values.newClientEmail || "").trim();
        const newPhone = values.newClientPhone
          ? String(values.newClientPhone).replace(/\D/g, "")
          : "";

        if (!newName) {
          message.error("Please enter the new client company name.");
          return;
        }
        if (!newEmail) {
          message.error("Please enter the new client email.");
          return;
        }
        if (!newPhone) {
          message.error("Please enter the new client phone number.");
          return;
        }

        const clientData = {
          name: newName,
          email: newEmail,
          phone: newPhone,
          countryCode: newClientCountryCode || "91",
          loginEmail: newEmail,
          loginPassword: "#India123",
          address: { country: "India" },
        };

        const clientResult = await createCompany(clientData).unwrap();
        resolvedCompanyId =
          clientResult?.data?.company?._id ||
          clientResult?.data?._id ||
          clientResult?._id;

        if (!resolvedCompanyId) {
          message.error("Failed to retrieve new client ID. Please try again.");
          return;
        }
        message.success(`New client "${newName}" created successfully.`);
      }

      // Build domain purchase payload
      // In new-client mode, use the new client's phone as the contact number
      const contactNum =
        clientMode === "new"
          ? values.newClientPhone
            ? String(values.newClientPhone).replace(/\D/g, "")
            : null
          : values.contactNumber
            ? values.contactNumber.replace(/\D/g, "")
            : null;
      const contactCC =
        clientMode === "new"
          ? newClientCountryCode || "91"
          : contactCountryCode || "91";
      const data = {
        companyId: resolvedCompanyId,
        contactPerson: values.contactPerson,
        contactNumber: contactNum,
        contactCountryCode: contactCC,
        domainName: values.domainName,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null,
        product: values.product,
        paidAmount: values.paidAmount || 0,
        balance: values.balance || 0,
        paymentDate: values.paymentDate
          ? values.paymentDate.toISOString()
          : new Date().toISOString(),
        gst: values.gst || 0,
        paymentDetail: values.paymentDetail,
        paymentRemarks: values.paymentRemarks,
      };

      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });

      if (screenshotFile) {
        formData.append("paymentScreenshotFile", screenshotFile);
      }

      if (isEdit) {
        await updateDomainPurchase({ id: domainPurchaseId, formData }).unwrap();
        message.success("Domain purchase updated successfully");
      } else {
        await createDomainPurchase(formData).unwrap();
        message.success("Domain purchase created successfully");
      }

      form.resetFields();
      setScreenshotFile(null);
      setFileList([]);
      setSelectedCompanyId(null);
      setCompanySearch("");
      setContactCountryCode("91");
      setClientMode("existing");
      setNewClientCountryCode("91");

      if (onSuccess) onSuccess();
      onCancel();
    } catch (error) {
      message.error(error?.data?.message || "Operation failed");
    }
  };

  const isSubmitting = isCreating || isUpdating || isCreatingClient;

  return (
    <Modal
      title={isEdit ? "Edit Domain Purchase" : "Create Domain Purchase"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
      centered
      styles={{ body: { height: "600px", overflowY: "auto" } }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {/* Client Selection Mode (only for create) */}
        {!isEdit && (
          <Form.Item label="Client">
            <Radio.Group value={clientMode} onChange={handleModeChange}>
              <Radio.Button value="existing">Select Existing Client</Radio.Button>
              <Radio.Button value="new">
                <PlusOutlined /> Create New Client
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        )}

        {/* Existing client selector */}
        {(isEdit || clientMode === "existing") && (
          <Form.Item
            name="companyId"
            label="Company Name"
            rules={[{ required: true, message: "Please select company name" }]}
          >
            <Select
              showSearch
              placeholder="Select company"
              filterOption={false}
              onSearch={setCompanySearch}
              onChange={(value) => {
                setSelectedCompanyId(value);
              }}
              style={{ width: "100%" }}
            >
              {companies.map((company) => (
                <Option key={company._id} value={company._id}>
                  {company.companyName || company.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* New client inline fields */}
        {!isEdit && clientMode === "new" && (
          <>
            <div
              style={{
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 8 }}>
                <UserOutlined style={{ color: "#52c41a" }} />
                <span style={{ fontWeight: 600, color: "#389e0d" }}>
                  New Client Details
                </span>
                <Tag color="green">Will be auto-created on submit</Tag>
              </div>

              <Form.Item
                name="newClientName"
                label="Client Company Name"
                rules={[{ required: clientMode === "new", message: "Please enter client company name" }]}
                style={{ marginBottom: 12 }}
              >
                <Input placeholder="Enter client company name" prefix={<UserOutlined />} />
              </Form.Item>

              <Form.Item
                name="newClientEmail"
                label="Email ID"
                rules={[
                  { required: clientMode === "new", message: "Please enter email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
                style={{ marginBottom: 12 }}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>

              <Form.Item
                name="newClientPhone"
                label="Phone Number"
                rules={[
                  { required: clientMode === "new", message: "Please enter phone number" },
                  {
                    validator: (_, value) =>
                      value && String(value).replace(/\D/g, "").length > 0
                        ? Promise.resolve()
                        : Promise.reject(new Error("Please enter a valid phone number")),
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <PhoneInput
                  countryCodeValue={newClientCountryCode}
                  onCountryCodeChange={setNewClientCountryCode}
                  placeholder="Enter phone number"
                />
              </Form.Item>
            </div>
          </>
        )}

        <Divider style={{ margin: "8px 0 16px" }} />

        <Form.Item
          name="contactPerson"
          label="Contact Person"
          rules={[
            { required: true, message: "Please enter contact person name" },
            { min: 2, message: "Name must be at least 2 characters" },
            { max: 100, message: "Name must not exceed 100 characters" },
          ]}
        >
          <Input placeholder="Enter contact person name" />
        </Form.Item>

        {clientMode !== "new" && (
          <Form.Item
            name="contactNumber"
            label="Contact Number"
            rules={[
              { required: true, message: "Please enter contact number" },
              {
                validator: (_, value) =>
                  value && String(value).replace(/\D/g, "").length > 0
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("Please enter a valid mobile number"),
                      ),
              },
            ]}
          >
            <PhoneInput
              countryCodeValue={contactCountryCode}
              onCountryCodeChange={setContactCountryCode}
              placeholder="Enter contact number"
            />
          </Form.Item>
        )}

        <Form.Item
          name="domainName"
          label="Domain Name"
          rules={[
            { required: true, message: "Please enter domain name" },
            {
              pattern:
                /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
              message: "Please enter a valid domain name (e.g., example.com)",
            },
          ]}
        >
          <Input placeholder="e.g., example.com" />
        </Form.Item>

        <Form.Item
          name="expiryDate"
          label="Expiry Date"
          rules={[{ required: true, message: "Please select expiry date" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            placeholder="Select expiry date"
          />
        </Form.Item>

        <Form.Item
          name="product"
          label="Product"
          rules={[{ required: true, message: "Please enter product name" }]}
        >
          <Input placeholder="Enter product name" />
        </Form.Item>

        <Form.Item
          name="paidAmount"
          label="Paid Amount (₹)"
          rules={[
            { required: true, message: "Please enter paid amount" },
            {
              type: "number",
              min: 0,
              message: "Amount must be greater than or equal to 0",
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            step={0.01}
            precision={2}
            formatter={(value) =>
              value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
            }
            parser={(value) => (value ? value.replace(/₹\s?|(,*)/g, "") : "")}
            placeholder="Enter paid amount"
          />
        </Form.Item>

        <Form.Item
          name="balance"
          label="Balance (₹)"
          rules={[
            {
              type: "number",
              min: 0,
              message: "Balance must be greater than or equal to 0",
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            step={0.01}
            precision={2}
            formatter={(value) =>
              value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
            }
            parser={(value) => (value ? value.replace(/₹\s?|(,*)/g, "") : "")}
            placeholder="Enter balance amount"
          />
        </Form.Item>

        <Form.Item
          name="paymentDate"
          label="Payment Date"
          rules={[{ required: true, message: "Please select payment date" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            placeholder="Select payment date"
          />
        </Form.Item>

        <Form.Item
          name="gst"
          label={`GST (₹) ${taxEnabled && taxPercentage > 0 ? `- ${gstInfo.label}` : ""}`}
          tooltip={
            !taxEnabled
              ? "GST calculation requires tax settings and client address with state code."
              : taxEnabled && taxPercentage > 0
                ? `Auto-calculated based on ${gstInfo.label}`
                : "GST will be calculated automatically when company and amount are entered."
          }
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            step={0.01}
            precision={2}
            formatter={(value) =>
              value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
            }
            parser={(value) => (value ? value.replace(/₹\s?|(,*)/g, "") : "")}
            placeholder={
              taxEnabled && taxPercentage > 0
                ? "Auto-calculated"
                : "Enter GST amount"
            }
            disabled={taxEnabled && taxPercentage > 0 && paidAmount > 0}
          />
        </Form.Item>

        <Form.Item name="paymentDetail" label="Payment Detail">
          <TextArea rows={3} placeholder="Enter payment details" />
        </Form.Item>

        <Form.Item name="paymentRemarks" label="Payment Remarks">
          <TextArea rows={3} placeholder="Enter payment remarks" />
        </Form.Item>

        <Form.Item label="Payment Screenshot">
          <Upload
            fileList={fileList}
            beforeUpload={(file) => {
              setScreenshotFile(file);
              setFileList([file]);
              return false;
            }}
            onRemove={() => {
              setScreenshotFile(null);
              setFileList([]);
            }}
            maxCount={1}
            listType="picture-card"
          >
            {fileList.length < 1 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item style={{ textAlign: "end" }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
            >
              {isEdit ? "Update" : "Create"}
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DomainPurchaseForm;
