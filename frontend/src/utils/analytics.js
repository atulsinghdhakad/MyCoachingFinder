import ReactGA from "react-ga4";

export const initGA = () => {
  ReactGA.initialize("G-XXXXXXXXXX"); // 🔁 Replace with your GA4 Measurement ID
};

export const trackPageView = (url) => {
  ReactGA.send({ hitType: "pageview", page: url });
};

export const trackEvent = (category, action, label) => {
  ReactGA.event({ category, action, label });
};
