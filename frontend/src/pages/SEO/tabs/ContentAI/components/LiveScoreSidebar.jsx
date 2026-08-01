import React from 'react';

const LiveScoreSidebar = ({ seoScore, readability }) => {
  return (
    <div className="live-score-sidebar">
      <div className="score-widget">
        <h4>SEO Score</h4>
        <div className={`score-circle ${seoScore >= 95 ? 'excellent' : seoScore >= 70 ? 'good' : 'poor'}`}>
          {seoScore}
        </div>
      </div>
      
      <div className="score-widget">
        <h4>Readability</h4>
        <div className={`score-bar-container`}>
           <div className="score-bar" style={{ width: `${readability}%` }}></div>
           <span>{readability}/100</span>
        </div>
      </div>
    </div>
  );
};

export default LiveScoreSidebar;
