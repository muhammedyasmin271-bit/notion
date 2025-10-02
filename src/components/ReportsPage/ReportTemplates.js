export const reportTemplates = {
  // Management Templates
  management: [
    {
      id: 'executive-summary',
      name: 'Executive Summary Report',
      icon: '📊',
      category: 'Strategic',
      description: 'High-level overview for stakeholders',
      template: `# Executive Summary Report

**Report Period:** {currentDate}
**Prepared By:** {userName}
**Department:** 
**Report Type:** Executive Summary

---

## 📊 Key Performance Indicators

### Financial Metrics
| Metric | Target | Actual | Variance | Status |
|--------|--------|--------|----------|-------|
| Revenue | $ | $ | $ | ✅/❌ |
| Profit Margin | % | % | % | ✅/❌ |
| Cost Reduction | $ | $ | $ | ✅/❌ |
| ROI | % | % | % | ✅/❌ |

### Operational Metrics
| Metric | Target | Actual | Variance | Status |
|--------|--------|--------|----------|-------|
| Customer Satisfaction | 90% | % | % | ✅/❌ |
| Employee Retention | 95% | % | % | ✅/❌ |
| Project Delivery | 100% | % | % | ✅/❌ |
| Quality Score | 95% | % | % | ✅/❌ |

## 🎯 Key Highlights

### Major Achievements
• **Achievement 1:** 
  - Impact: 
  - Value: $
  - Timeline: 

• **Achievement 2:** 
  - Impact: 
  - Value: $
  - Timeline: 

### Critical Issues
• **Issue 1:** 
  - Severity: High/Medium/Low
  - Impact: 
  - Resolution Plan: 

## 📈 Performance Overview

### Department Performance
| Department | Score | Trend | Key Wins | Challenges |
|------------|-------|-------|----------|------------|
| Sales | /10 | 📈/📉 | | |
| Marketing | /10 | 📈/📉 | | |
| Development | /10 | 📈/📉 | | |
| Operations | /10 | 📈/📉 | | |

## 🚀 Strategic Initiatives

### Current Initiatives
| Initiative | Priority | Progress | Budget | Timeline | Status |
|------------|----------|----------|--------|----------|--------|
| | High/Med/Low | % | $ | | ✅/🔄/❌ |

### Upcoming Initiatives
• **Initiative 1:** 
  - Objective: 
  - Resources Required: 
  - Expected Outcome: 
  - Timeline: 

## 🔮 Next Quarter Focus

### Priority Goals
1. **Goal 1:** 
   - Success Metrics: 
   - Resources: 
   - Timeline: 

2. **Goal 2:** 
   - Success Metrics: 
   - Resources: 
   - Timeline: 

### Risk Assessment
| Risk | Probability | Impact | Mitigation Strategy | Owner |
|------|-------------|--------|-------------------|-------|
| | High/Med/Low | High/Med/Low | | |

## 📋 Action Items

### Immediate Actions (Next 30 Days)
- [ ] 
- [ ] 
- [ ] 

### Short-term Actions (Next 90 Days)
- [ ] 
- [ ] 
- [ ] 

---

**Report Status:** Draft/Review/Approved
**Next Review Date:** 
**Distribution:** 

*This report was generated on {currentDate} at {currentTime} by {userName}*`
    },
    {
      id: 'team-performance',
      name: 'Team Performance Review',
      icon: '👥',
      category: 'Management',
      description: 'Comprehensive team assessment',
      template: `# Team Performance Review Report

**Review Period:** {currentDate}
**Manager:** {userName}
**Team:** 
**Review Type:** Quarterly Performance Review

---

## 👥 Team Overview

### Team Composition
| Member | Role | Experience | Performance Rating | Status |
|--------|------|------------|------------------|--------|
| | | years | /10 | Active/On Leave |
| | | years | /10 | Active/On Leave |
| | | years | /10 | Active/On Leave |

### Team Metrics
| Metric | Target | Actual | Trend | Notes |
|--------|--------|--------|-------|-------|
| Team Size | | | 📈/📉 | |
| Productivity Score | 85% | % | 📈/📉 | |
| Goal Completion | 90% | % | 📈/📉 | |
| Collaboration Score | 80% | % | 📈/📉 | |

## 🏆 Individual Highlights

### Top Performers
• **Team Member 1:** 
  - Key Achievements: 
  - Impact: 
  - Recognition: 

• **Team Member 2:** 
  - Key Achievements: 
  - Impact: 
  - Recognition: 

### Rising Stars
• **Emerging Talent 1:** 
  - Potential: 
  - Development Areas: 
  - Growth Plan: 

## 📊 Performance Analysis

### Strengths
• **Technical Excellence:** 
  - Examples: 
  - Impact: 

• **Collaboration:** 
  - Examples: 
  - Impact: 

### Areas for Improvement
• **Skill Gaps:** 
  - Gap 1: 
  - Training Needed: 
  - Timeline: 

• **Process Issues:** 
  - Issue 1: 
  - Solution: 
  - Owner: 

## 🎯 Goal Analysis

### Achieved Goals
| Goal | Target | Actual | Impact | Lessons Learned |
|------|--------|--------|--------|----------------|
| | | | | |

### Missed Goals
| Goal | Target | Actual | Reason | Action Plan |
|------|--------|--------|--------|-------------|
| | | | | |

## 🚀 Development Plans

### Individual Development
| Team Member | Development Focus | Training | Timeline | Budget |
|-------------|-------------------|----------|----------|--------|
| | | | | $ |

### Team Development
• **Skill Enhancement:** 
  - Program: 
  - Duration: 
  - Cost: $

• **Team Building:** 
  - Activities: 
  - Schedule: 
  - Budget: $

## 📈 Career Progression

### Promotion Recommendations
| Team Member | Current Role | Recommended Role | Justification | Timeline |
|-------------|--------------|------------------|---------------|----------|
| | | | | |

### Succession Planning
• **Key Position 1:** 
  - Current Holder: 
  - Successor: 
  - Development Plan: 

## 🔄 Action Items

### Immediate Actions (Next 30 Days)
- [ ] 
- [ ] 
- [ ] 

### Short-term Actions (Next 90 Days)
- [ ] 
- [ ] 
- [ ] 

## 📋 Next Review Planning

### Focus Areas for Next Quarter
1. **Priority 1:** 
2. **Priority 2:** 
3. **Priority 3:** 

### Review Schedule
• **Next Review Date:** 
• **Review Type:** 
• **Participants:** 

---

**Review Status:** Draft/Review/Approved
**Manager Signature:** 
**HR Review:** 

*This review was conducted on {currentDate} at {currentTime} by {userName}*`
    }
  ],

  // Project Templates
  project: [
    {
      id: 'weekly-status',
      name: 'Weekly Status Report',
      icon: '📅',
      category: 'Status',
      description: 'Regular progress updates',
      template: `# Weekly Status Report

**Report Date:** {currentDate}
**Reporter:** {userName}
**Role:** {userRole}
**Week:** Week of {currentDate}
**Report Type:** Weekly Status Update

---

## 📅 This Week's Accomplishments

### Completed Tasks
| Task | Priority | Status | Time Spent | Impact |
|------|----------|--------|------------|--------|
| | High/Med/Low | ✅ Complete | hours | High/Med/Low |
| | High/Med/Low | ✅ Complete | hours | High/Med/Low |
| | High/Med/Low | ✅ Complete | hours | High/Med/Low |

### Key Deliverables
• **Deliverable 1:** 
  - Description: 
  - Status: Complete/In Progress
  - Quality: Excellent/Good/Fair

• **Deliverable 2:** 
  - Description: 
  - Status: Complete/In Progress
  - Quality: Excellent/Good/Fair

### Metrics & KPIs
| Metric | Target | Actual | Status | Notes |
|--------|--------|--------|--------|-------|
| Tasks Completed | | | ✅/❌ | |
| Hours Worked | | | ✅/❌ | |
| Quality Score | 90% | % | ✅/❌ | |
| Customer Satisfaction | 85% | % | ✅/❌ | |

## 🚧 Challenges Faced

### Technical Challenges
• **Challenge 1:** 
  - Description: 
  - Impact: High/Medium/Low
  - Resolution: 
  - Time Lost: hours

• **Challenge 2:** 
  - Description: 
  - Impact: High/Medium/Low
  - Resolution: 
  - Time Lost: hours

### Process Challenges
• **Process Issue:** 
  - Description: 
  - Impact: 
  - Suggested Solution: 
  - Owner: 

### Resource Challenges
• **Resource Constraint:** 
  - Description: 
  - Impact: 
  - Workaround: 
  - Long-term Solution: 

## 🎯 Next Week's Goals

### Priority Tasks
- [ ] **High Priority:** 
  - Description: 
  - Estimated Time: hours
  - Dependencies: 

- [ ] **High Priority:** 
  - Description: 
  - Estimated Time: hours
  - Dependencies: 

- [ ] **Medium Priority:** 
  - Description: 
  - Estimated Time: hours
  - Dependencies: 

### Upcoming Deadlines
| Task | Deadline | Priority | Preparation Needed |
|------|----------|----------|-------------------|
| | | High/Med/Low | |
| | | High/Med/Low | |

### Learning & Development
• **Skill Development:** 
  - Goal: 
  - Resources: 
  - Timeline: 

• **Training:** 
  - Course: 
  - Duration: 
  - Expected Outcome: 

## 🤝 Support Needed

### Immediate Support
• **Technical Support:** 
  - Issue: 
  - Urgency: High/Medium/Low
  - Contact: 

• **Manager Support:** 
  - Request: 
  - Urgency: High/Medium/Low
  - Timeline: 

### Resource Requests
• **Additional Resources:** 
  - Type: Personnel/Equipment/Training
  - Justification: 
  - Timeline: 

• **Budget Requests:** 
  - Amount: $
  - Purpose: 
  - ROI: 

## 📊 Performance Insights

### Productivity Analysis
• **Most Productive Time:** 
• **Least Productive Time:** 
• **Distraction Factors:** 
• **Focus Strategies:** 

### Quality Metrics
• **Error Rate:** % (Target: <5%)
• **Rework Required:** % (Target: <10%)
• **Customer Feedback:** 
• **Peer Reviews:** 

### Time Management
• **Time Allocation:** 
  - Development: %
  - Meetings: %
  - Admin: %
  - Learning: %

## 🔄 Continuous Improvement

### Process Improvements
• **Inefficiency Identified:** 
  - Current Process: 
  - Suggested Improvement: 
  - Expected Benefit: 

### Tool Recommendations
• **Tool Needed:** 
  - Purpose: 
  - Cost: $
  - Justification: 

### Knowledge Sharing
• **Knowledge Gained:** 
• **Knowledge Shared:** 
• **Documentation Created:** 

## 📋 Action Items

### For Next Week
- [ ] 
- [ ] 
- [ ] 

### Follow-up Required
- [ ] 
- [ ] 
- [ ] 

### Blockers to Address
- [ ] 
- [ ] 
- [ ] 

---

**Report Status:** Draft/Review/Approved
**Manager Review:** 
**Next Report Due:** 

*This report was generated on {currentDate} at {currentTime} by {userName}*`
    },
    {
      id: 'project-milestone',
      name: 'Project Milestone Report',
      icon: '🏆',
      category: 'Project',
      description: 'Milestone completion tracking',
      template: `# Project Milestone Report

**Project Name:** 
**Milestone:** 
**Due Date:** 
**Status:** On Track/At Risk/Delayed/Complete
**Reporter:** {userName}
**Date:** {currentDate}

---

## 🎯 Milestone Overview

### Milestone Details
| Attribute | Details |
|-----------|---------|
| Milestone Name | |
| Project Phase | |
| Start Date | |
| Target Date | |
| Actual Date | |
| Budget Allocated | $ |
| Budget Used | $ |

### Success Criteria
- [ ] Criterion 1: 
- [ ] Criterion 2: 
- [ ] Criterion 3: 
- [ ] Criterion 4: 

## ✅ Completed Tasks

### Major Deliverables
| Deliverable | Owner | Completion Date | Quality Score | Notes |
|-------------|-------|----------------|---------------|-------|
| | | | /10 | |
| | | | /10 | |
| | | | /10 | |

### Key Achievements
• **Achievement 1:** 
  - Impact: 
  - Stakeholder Feedback: 
  - Lessons Learned: 

• **Achievement 2:** 
  - Impact: 
  - Stakeholder Feedback: 
  - Lessons Learned: 

## 🚧 Remaining Work

### Outstanding Tasks
| Task | Owner | Priority | Estimated Effort | Dependencies |
|------|-------|----------|------------------|-------------|
| | | High/Med/Low | hours | |
| | | High/Med/Low | hours | |
| | | High/Med/Low | hours | |

### Critical Path Items
- [ ] **Critical Task 1:** 
  - Description: 
  - Owner: 
  - Due Date: 
  - Risk Level: High/Med/Low

- [ ] **Critical Task 2:** 
  - Description: 
  - Owner: 
  - Due Date: 
  - Risk Level: High/Med/Low

## 📊 Progress Metrics

### Completion Status
| Category | Planned | Completed | % Complete | Status |
|----------|---------|-----------|------------|--------|
| Requirements | | | % | ✅/❌ |
| Design | | | % | ✅/❌ |
| Development | | | % | ✅/❌ |
| Testing | | | % | ✅/❌ |
| Documentation | | | % | ✅/❌ |

### Quality Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Defect Rate | <5% | % | ✅/❌ |
| Test Coverage | >90% | % | ✅/❌ |
| Code Review | 100% | % | ✅/❌ |
| Documentation | 100% | % | ✅/❌ |

## ⚠️ Risks & Issues

### Current Risks
| Risk | Probability | Impact | Mitigation Plan | Owner |
|------|-------------|--------|----------------|-------|
| | High/Med/Low | High/Med/Low | | |
| | High/Med/Low | High/Med/Low | | |

### Active Issues
| Issue | Severity | Impact | Resolution Plan | ETA |
|-------|----------|--------|----------------|-----|
| | Critical/High/Med/Low | | | |
| | Critical/High/Med/Low | | | |

### Blockers
• **Blocker 1:** 
  - Description: 
  - Impact: 
  - Resolution Required: 
  - Owner: 

## 📈 Performance Analysis

### Schedule Performance
• **Planned vs Actual:** 
• **Schedule Variance:** days
• **Critical Path Status:** On Track/At Risk/Delayed
• **Recovery Plan:** 

### Budget Performance
• **Budget Variance:** $
• **Cost Performance Index:** 
• **Forecast at Completion:** $
• **Budget Status:** Under/On/Over Budget

### Resource Utilization
• **Team Utilization:** %
• **Resource Constraints:** 
• **Additional Resources Needed:** 
• **Skills Gaps:** 

## 🔮 Next Milestone Preview

### Upcoming Milestone
• **Milestone Name:** 
• **Target Date:** 
• **Key Deliverables:** 
• **Success Criteria:** 

### Preparation Required
- [ ] Resource allocation
- [ ] Stakeholder alignment
- [ ] Risk mitigation
- [ ] Quality assurance setup

## 📋 Action Items

### Immediate Actions (Next 7 Days)
- [ ] 
- [ ] 
- [ ] 

### Short-term Actions (Next 30 Days)
- [ ] 
- [ ] 
- [ ] 

### Stakeholder Communications
- [ ] Update project sponsor
- [ ] Notify affected teams
- [ ] Schedule review meeting
- [ ] Update project dashboard

## 🎉 Stakeholder Feedback

### Client/Sponsor Feedback
• **Satisfaction Level:** /10
• **Key Comments:** 
• **Concerns Raised:** 
• **Appreciation:** 

### Team Feedback
• **Team Morale:** /10
• **Process Feedback:** 
• **Improvement Suggestions:** 
• **Recognition:** 

---

**Milestone Status:** Complete/In Progress/At Risk/Delayed
**Next Review Date:** 
**Stakeholder Sign-off:** 

*This milestone report was prepared on {currentDate} at {currentTime} by {userName}*`
    }
  ],

  // Technical Templates
  technical: [
    {
      id: 'bug-report',
      name: 'Bug Report',
      icon: '🐛',
      category: 'Technical',
      description: 'Detailed bug documentation and resolution',
      template: `# Bug Report

## 🐛 Bug Information
**Bug ID:** {bugId}
**Reported By:** {userName}
**Date:** {currentDate}
**Time:** {currentTime}
**Priority:** High/Medium/Low
**Severity:** Critical/Major/Minor
**Status:** Open/In Progress/Resolved/Closed
**Assigned To:** 

---

## 📝 Description

### Summary
**Brief Description:** 

### Detailed Description
**What happened:** 

**What was expected:** 

**What actually happened:** 

### Impact Assessment
| Impact Area | Severity | Description |
|-------------|----------|-------------|
| User Experience | High/Med/Low | |
| System Performance | High/Med/Low | |
| Data Integrity | High/Med/Low | |
| Security | High/Med/Low | |
| Business Impact | High/Med/Low | |

## 🌐 Environment

### System Information
| Component | Details |
|----------|---------|
| OS | |
| Browser | |
| Version | |
| Device | |
| Screen Resolution | |
| Network | |

### Application Details
| Component | Version |
|----------|---------|
| Application | |
| Database | |
| API | |
| Frontend | |
| Backend | |

### Configuration
• **Environment:** Production/Staging/Development
• **User Role:** 
• **Permissions:** 
• **Custom Settings:** 

## 🔄 Steps to Reproduce

### Reproduction Steps
1. **Step 1:** 
   - Action: 
   - Expected: 
   - Actual: 

2. **Step 2:** 
   - Action: 
   - Expected: 
   - Actual: 

3. **Step 3:** 
   - Action: 
   - Expected: 
   - Actual: 

### Frequency
• **How often:** Always/Sometimes/Rarely
• **Reproducibility:** 100%/75%/50%/25%/0%
• **First Occurrence:** 

## 📸 Evidence

### Screenshots
• **Screenshot 1:** [Attach]
• **Screenshot 2:** [Attach]
• **Screenshot 3:** [Attach]

### Logs
• **Error Logs:** 
• **Console Logs:** 
• **Server Logs:** 
• **Network Logs:** 

### Additional Files
• **Configuration Files:** [Attach]
• **Data Files:** [Attach]
• **Test Files:** [Attach]

## 🔍 Additional Information

### Related Issues
• **Related Bug:** 
• **Related Feature:** 
• **Dependencies:** 

### Workarounds
• **Temporary Fix:** 
• **User Workaround:** 
• **System Workaround:** 

### Context
• **User Story:** 
• **Business Case:** 
• **Customer Impact:** 

## 🛠️ Resolution

### Analysis
• **Root Cause:** 
• **Technical Details:** 
• **Code Location:** 

### Solution
• **Fix Description:** 
• **Code Changes:** 
• **Configuration Changes:** 

### Testing
• **Test Cases:** 
• **Test Results:** 
• **Regression Testing:** 

## 📊 Resolution Details

### Resolution Information
| Field | Value |
|------|-------|
| Resolution Date | |
| Resolution Time | hours |
| Fix Type | Code/Config/Data/Process |
| Complexity | Low/Medium/High |
| Effort | hours |

### Quality Assurance
• **QA Testing:** Pass/Fail
• **User Acceptance:** Pass/Fail
• **Performance Impact:** None/Minor/Major
• **Security Review:** Pass/Fail

### Deployment
• **Deployment Date:** 
• **Deployment Method:** 
• **Rollback Plan:** 
• **Monitoring:** 

## 📈 Metrics

### Bug Metrics
• **Time to Resolution:** hours
• **Time to Fix:** hours
• **Time to Deploy:** hours
• **Customer Impact:** High/Medium/Low

### Process Metrics
• **Escalations:** 
• **Reopens:** 
• **Related Bugs:** 
• **Lessons Learned:** 

## 🔄 Follow-up

### Verification
• **Fixed Verified By:** 
• **Verification Date:** 
• **Verification Method:** 

### Prevention
• **Process Improvements:** 
• **Code Review Changes:** 
• **Testing Improvements:** 

### Documentation
• **Knowledge Base Update:** 
• **Training Materials:** 
• **Process Documentation:** 

---

**Bug Status:** Open/In Progress/Resolved/Closed
**Last Updated:** {currentDate}
**Next Review:** 

*This bug report was created on {currentDate} at {currentTime} by {userName}*`
    }
  ]
};

export const getTemplatesByRole = (userRole) => {
  if (userRole === 'manager' || userRole === 'admin' || userRole === 'ceo') {
    return [...reportTemplates.management, ...reportTemplates.technical];
  } else {
    return [...reportTemplates.project, ...reportTemplates.technical];
  }
};

export const populateTemplate = (template, userData) => {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  const userName = userData?.name || 'User';
  const userRole = userData?.role || 'Worker';
  
  return template
    .replace(/\{currentDate\}/g, currentDate)
    .replace(/\{currentTime\}/g, currentTime)
    .replace(/\{userName\}/g, userName)
    .replace(/\{userRole\}/g, userRole)
    .replace(/\{today\}/g, currentDate)
    .replace(/\{now\}/g, currentTime)
    .replace(/\{bugId\}/g, `BUG-${currentDate.replace(/\//g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`);
};