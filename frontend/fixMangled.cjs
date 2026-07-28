const fs = require('fs');

const file = 'e:/Bcc Seo/frontend/src/pages/performance/PerformanceScorecardPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// The file currently has:
// 152:     const filename = `performance_scorecards_${selectedMonth}_${selectedYear}_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.csv`;
// 153:       dataIndex: "name",

// I need to replace from `const filename = \`performance_scorecards_...` 
// up to `      dataIndex: "name",` 
// with the correct block of code.

const targetStart = "    const filename = `performance_scorecards_${selectedMonth}_${selectedYear}_${dayjs().format(\"YYYY-MM-DD_HH-mm-ss\")}.csv`;";
const targetEnd = "      dataIndex: \"name\",";

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const codeToInsert = `    const filename = \`performance_scorecards_\${selectedMonth}_\${selectedYear}_\${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.csv\`;
    exportToCSV(allScorecards, exportColumns, filename);
    message.success(
      \`Exported \${allScorecards.length} scorecard(s) successfully\`,
    );
  };

  const handleNotifyPending = async () => {
    setNotificationModalVisible(true);
    // Refetch pending users when modal opens
    if (isAdmin) {
      refetchPendingUsers();
    }
  };

  const handleSendNotifications = async () => {
    try {
      setNotifying(true);
      const { data, error } = await notifyPending({
        month: selectedMonth,
        year: selectedYear,
      });

      if (error) throw error;

      message.success(\`Notifications sent to \${data?.data?.notified || 0} user(s)\`);
      setNotificationModalVisible(false);
      refetchPendingUsers();
    } catch (error) {
      console.error("Error sending notifications:", error);
      message.error(error?.data?.message || "Failed to send notifications");
    } finally {
      setNotifying(false);
    }
  };

  const pendingUsers = pendingUsersData?.data?.users || [];

  const exportMenuItems = [
    {
      key: "export",
      label: "Export to CSV",
      icon: <DownloadOutlined />,
      onClick: handleExport,
    },
  ];

  const columns = [
    {
      title: "Name",
`;

  content = content.substring(0, startIndex) + codeToInsert + content.substring(endIndex);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Fixed!");
} else {
  console.log("Could not find targets");
}
