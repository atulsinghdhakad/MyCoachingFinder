import React from 'react';
import { Link } from 'react-router-dom';
import './TermsPage.css';

const TermsPage = () => {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <div className="terms-header">
          <h1 className="terms-title">
            <span className="title-icon">📋</span>
            Terms of Service
          </h1>
          <p className="terms-subtitle">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="terms-content">
          <section className="terms-section">
            <h2 className="section-title">1. Acceptance of Terms</h2>
            <p className="section-text">
              By accessing and using Coaching Finder, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">2. Use License</h2>
            <p className="section-text">
              Permission is granted to temporarily download one copy of the materials (information or software) on Coaching Finder's website for personal, 
              non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="terms-list">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on Coaching Finder's website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="section-title">3. Disclaimer</h2>
            <p className="section-text">
              The materials on Coaching Finder's website are provided on an 'as is' basis. Coaching Finder makes no warranties, 
              expressed or implied, and hereby disclaims and negates all other warranties including without limitation, 
              implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">4. Limitations</h2>
            <p className="section-text">
              In no event shall Coaching Finder or its suppliers be liable for any damages (including, without limitation, 
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use 
              the materials on Coaching Finder's website, even if Coaching Finder or a Coaching Finder authorized representative 
              has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">5. Accuracy of Materials</h2>
            <p className="section-text">
              The materials appearing on Coaching Finder's website could include technical, typographical, or photographic errors. 
              Coaching Finder does not warrant that any of the materials on its website are accurate, complete, or current. 
              Coaching Finder may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">6. Links</h2>
            <p className="section-text">
              Coaching Finder has not reviewed all of the sites linked to its website and is not responsible for the contents 
              of any such linked site. The inclusion of any link does not imply endorsement by Coaching Finder of the site. 
              Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">7. Modifications</h2>
            <p className="section-text">
              Coaching Finder may revise these terms of service for its website at any time without notice. 
              By using this website you are agreeing to be bound by the then current version of these Terms of Service.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">8. Governing Law</h2>
            <p className="section-text">
              These terms and conditions are governed by and construed in accordance with the laws of India and 
              you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">9. Contact Information</h2>
            <p className="section-text">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> info@coachingfinder.com</p>
              <p><strong>Phone:</strong> +91 7427802072</p>
              <p><strong>Address:</strong> Indore, India</p>
            </div>
          </section>
        </div>

        <div className="terms-footer">
          <Link to="/" className="back-home-btn">
            <span className="btn-icon">🏠</span>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsPage; 