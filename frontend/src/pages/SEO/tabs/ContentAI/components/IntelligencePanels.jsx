import React from 'react';

const IntelligencePanels = ({ activeTab }) => {
  if (activeTab === 'keywords') {
    return (
      <div className="panel-content">
        <h4>Target Keyword</h4>
        <div className="keyword-chip primary">blog creation</div>
        
        <h4>Secondary Keywords</h4>
        <div className="keywords-list">
          <span className="keyword-chip success">start a blog</span>
          <span className="keyword-chip warning">best blogging platform</span>
          <span className="keyword-chip">make money blogging</span>
        </div>
      </div>
    );
  }

  if (activeTab === 'competitors') {
    return (
      <div className="panel-content">
        <h4>Top Competitors</h4>
        <ul className="competitor-list">
          <li>
             <strong>wpbeginner.com</strong>
             <br/><small>Word count: 3200 | Score: 92</small>
          </li>
          <li>
             <strong>hubspot.com</strong>
             <br/><small>Word count: 2100 | Score: 88</small>
          </li>
        </ul>
      </div>
    );
  }

  if (activeTab === 'serp') {
    return (
      <div className="panel-content">
        <h4>SERP Intent</h4>
        <p>Informational (How-to Guides)</p>
        
        <h4>Recommended Structure</h4>
        <ul>
          <li>FAQ Section</li>
          <li>Comparison Table</li>
          <li>Images (5+)</li>
        </ul>
      </div>
    );
  }

  return null;
};

export default IntelligencePanels;
