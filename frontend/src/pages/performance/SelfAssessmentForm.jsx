import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Space,
  message,
  Spin,
  Divider,
  Alert,
  Input
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useSubmitSelfAssessmentMutation,
  useGetSelfAssessmentQuery,
} from "../../api/performanceApi";
import { useAuth } from "../../contexts/AuthContext";
import { useGetNotificationsQuery } from "../../api/taskApi";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SelfAssessmentForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [currentDate] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  // Default to current month and year
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month);
  const [selectedYear, setSelectedYear] = useState(currentDate.year);

  const { data: selfAssessmentData, isLoading: isLoadingSelfAssessment } =
    useGetSelfAssessmentQuery(
      { month: selectedMonth, year: selectedYear },
      { skip: !selectedMonth || !selectedYear },
    );
  const [submitSelfAssessment, { isLoading: isSubmitting }] =
    useSubmitSelfAssessmentMutation();

  // Check if user has notification for this month/year
  const { data: notificationsData } = useGetNotificationsQuery();
  const notifications = notificationsData?.data?.notifications || [];
  const hasNotificationForPeriod = notifications.some(
    (notif) =>
      notif.type === "performance_self_assessment_pending" &&
      notif.metadata?.month === selectedMonth &&
      notif.metadata?.year === selectedYear,
  );

  const selfAssessment = selfAssessmentData?.data?.scorecard;

  // Performance categories configuration
  const performanceCategories = [
    { key: "officeTimeLogIn", label: "Office Time Log In" },
    { key: "attendance", label: "Attendance" },
    { key: "commitmentTowardsWork", label: "Commitment Towards Work" },
    { key: "discipline", label: "Discipline" },
    { key: "teamWork", label: "Team Work" },
    { key: "innovation", label: "Innovation" },
    { key: "dailyReportSubmission", label: "Daily Report Submission" },
    { key: "workConsistency", label: "Work Consistency" },
    {
      key: "workEvaluation",
      label:
        "Work Evaluation (Quality of Backlinks/SEO Analytics and Reporting/Task Completion and Deadline)",
    },
  ];

  const gradeOptions = [
    { value: "A", label: "A - EXCELLENT" },
    { value: "B", label: "B - GOOD" },
    { value: "C", label: "C - NEED IMPROVEMENT" },
    { value: "D", label: "D - REMAINS SAME" },
  ];

  useEffect(() => {
    if (selfAssessment) {
      const formValues = {};
      performanceCategories.forEach((cat) => {
        formValues[`${cat.key}_self`] =
          selfAssessment.performanceCategories?.[cat.key]?.self;
      });
      formValues.evaluationDate = selfAssessment.evaluationDate
        ? dayjs(selfAssessment.evaluationDate)
        : dayjs();
      form.setFieldsValue(formValues);
    }
  }, [selfAssessment, form]);

  const onFinish = async (values) => {
    try {
      const evaluationDate = values.evaluationDate
        ? values.evaluationDate.toISOString()
        : new Date().toISOString();

      const performanceCategoriesData = {};
      performanceCategories.forEach((cat) => {
        if (values[`${cat.key}_self`]) {
          performanceCategoriesData[cat.key] = {
            self: values[`${cat.key}_self`],
          };
        }
      });

      const selfAssessmentData = {
        month: selectedMonth,
        year: selectedYear,
        evaluationDate,
        performanceCategories: performanceCategoriesData,
      };

      const { error } = await submitSelfAssessment(selfAssessmentData);
      if (error) throw error;
      message.success("Self-assessment submitted successfully!");
const basePath = location.pathname.startsWith("/agency") ? "/agency/hrms/performance" : location.pathname.startsWith("/client") ? "/client/hrms/performance" : location.pathname.startsWith("/user") ? "/user/performance" : "/hrms/performance";
      navigate(`${basePath}/history`);
    } catch (error) {
      message.error(error?.data?.message || "Failed to submit self-assessment");
    }
  };

  const isReviewCompleted = selfAssessment?.status === "review_completed";
  const isSubmitted = selfAssessment?.status === "self_submitted";
  const canSubmit =
    hasNotificationForPeriod && !isSubmitted && !isReviewCompleted;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => { const basePath = location.pathname.startsWith("/agency") ? "/agency/hrms/performance" : location.pathname.startsWith("/client") ? "/client/hrms/performance" : location.pathname.startsWith("/user") ? "/user/performance" : "/hrms/performance"; navigate(basePath); }}
        >
          Back
        </Button>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
          Self-Assessment
        </h1>
      </div>

      <Card>
        {isLoadingSelfAssessment ? (
          <Spin />
        ) : (
          <>
            {isReviewCompleted && (
              <Alert
                message="Review Completed"
                description="Your self-assessment has been reviewed. You can view the review in your performance history."
                type="info"
                showIcon
                style={{ marginBottom: "24px" }}
                action={
                  <Button
                    size="small"
                    onClick={() => { const basePath = location.pathname.startsWith("/agency") ? "/agency/hrms/performance" : location.pathname.startsWith("/client") ? "/client/hrms/performance" : location.pathname.startsWith("/user") ? "/user/performance" : "/hrms/performance"; navigate(`${basePath}/history`); }}
                  >
                    View Review
                  </Button>
                }
              />
            )}

            {isSubmitted && !isReviewCompleted && (
              <Alert
                message="Already Submitted"
                description={`You have already submitted your self-assessment for ${new Date(2000, selectedMonth - 1).toLocaleString("default", { month: "long" })} ${selectedYear}. You cannot submit again for this period.`}
                type="warning"
                showIcon
                style={{ marginBottom: "24px" }}
                action={
                  <Button
                    size="small"
                    onClick={() => { const basePath = location.pathname.startsWith("/agency") ? "/agency/hrms/performance" : location.pathname.startsWith("/client") ? "/client/hrms/performance" : location.pathname.startsWith("/user") ? "/user/performance" : "/hrms/performance"; navigate(`${basePath}/history`); }}
                  >
                    View Submission
                  </Button>
                }
              />
            )}

            {!hasNotificationForPeriod &&
              !isSubmitted &&
              !isReviewCompleted && (
                <Alert
                  message="Notification Required"
                  description={`You can only submit self-assessment after receiving a notification from admin for ${new Date(2000, selectedMonth - 1).toLocaleString("default", { month: "long" })} ${selectedYear}. Please wait for admin notification.`}
                  type="warning"
                  showIcon
                  style={{ marginBottom: "24px" }}
                />
              )}

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              disabled={isReviewCompleted || isSubmitted || !canSubmit}
              initialValues={{
                evaluationDate: dayjs(),
              }}
            >
              <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
                <Col xs={24} sm={8}>
                  <Text strong>Month:</Text>
                  <Select
                    style={{ width: "100%", marginTop: "8px" }}
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    disabled={isReviewCompleted || isSubmitted || !canSubmit}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <Option key={month} value={month}>
                          {new Date(2000, month - 1).toLocaleString("default", {
                            month: "long",
                          })}
                        </Option>
                      ),
                    )}
                  </Select>
                </Col>
                <Col xs={24} sm={8}>
                  <Text strong>Year:</Text>
                  <Select
                    style={{ width: "100%", marginTop: "8px" }}
                    value={selectedYear}
                    onChange={setSelectedYear}
                    disabled={isReviewCompleted || isSubmitted || !canSubmit}
                  >
                    {Array.from(
                      { length: 10 },
                      (_, i) => new Date().getFullYear() - i,
                    ).map((year) => (
                      <Option key={year} value={year}>
                        {year}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="evaluationDate"
                    label="Evaluation Date"
                    rules={[
                      {
                        required: true,
                        message: "Please select evaluation date",
                      },
                    ]}
                    style={{ marginTop: "8px" }}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      disabled={isReviewCompleted || isSubmitted || !canSubmit}
                      placeholder="Select evaluation date"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>Performance Categories - Self Assessment</Divider>

              {performanceCategories.map((category) => (
                <Card
                  key={category.key}
                  size="small"
                  style={{ marginBottom: "16px" }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Text strong>{category.label}</Text>
                    </Col>
                    <Col xs={24} sm={16}>
                      <Form.Item
                        name={`${category.key}_self`}
                        label="Your Grade"
                        rules={[
                          { required: true, message: "Please select a grade" },
                        ]}
                      >
                        <Select
                          placeholder="Select grade"
                          disabled={
                            isReviewCompleted || isSubmitted || !canSubmit
                          }
                        >
                          {gradeOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={isSubmitting}
                    disabled={isReviewCompleted || isSubmitted || !canSubmit}
                  >
                    {isSubmitted
                      ? "Already Submitted"
                      : "Submit Self-Assessment"}
                  </Button>
                  <Button onClick={() => { const basePath = location.pathname.startsWith("/agency") ? "/agency/hrms/performance" : location.pathname.startsWith("/client") ? "/client/hrms/performance" : location.pathname.startsWith("/user") ? "/user/performance" : "/hrms/performance"; navigate(basePath); }}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
};

export default SelfAssessmentForm;
