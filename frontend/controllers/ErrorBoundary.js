// import React from "react";

// class ErrorBoundary extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { hasError: false, errorInfo: null };
//   }

//   static getDerivedStateFromError() {
//     return { hasError: true };
//   }

//   componentDidCatch(error, errorInfo) {
//     console.error("React ErrorBoundary caught an error:", error, errorInfo);
//     this.setState({ errorInfo });
//     // Optionally: log to Sentry or your backend
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="min-h-screen flex items-center justify-center text-center bg-black text-white p-6">
//           <div>
//             <h1 className="text-2xl font-bold mb-2">Something went wrong.</h1>
//             <p className="text-neutral-400">
//               Please refresh the page or try again later.
//             </p>
//           </div>
//         </div>
//       );
//     }

//     return this.props.children;
//   }
// }

// export default ErrorBoundary;
