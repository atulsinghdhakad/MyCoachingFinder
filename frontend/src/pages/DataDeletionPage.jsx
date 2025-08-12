import React from 'react';

const DataDeletion = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Data Deletion Instructions
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          If you signed up to Coaching Finder using Facebook and want to delete your data, please follow these steps:
        </p>
        <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2">
          <li>Go to your Facebook account settings.</li>
          <li>Select <strong>Apps and Websites</strong> from the left menu.</li>
          <li>Find <strong>Coaching Finder</strong> in the list and click <strong>Remove</strong>.</li>
          <li>This will revoke access and automatically delete the data associated with your account.</li>
        </ol>
        <p className="mt-6 text-gray-700 dark:text-gray-300">
          Alternatively, you can contact us at <a href="mailto:contact@coachingfinder.com" className="text-blue-600 dark:text-blue-400 underline">contact@coachingfinder.com</a> with your Facebook user ID and we will remove your data manually within 48 hours.
        </p>
      </div>
    </div>
  );
};

export default DataDeletion;
