import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Subscription } from "@/src/types";

const useFetchSubscriptions = (
  setSubscriptions: Dispatch<SetStateAction<Subscription[]>>,
  setSubscriptionsLoading: Dispatch<SetStateAction<boolean>>
) => {
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await fetch("/api/subscription");
        const data = await response.json();
        setSubscriptions(data);
      } catch (err) {
        console.error("Error fetching subscriptions:", err);
      } finally {
        setSubscriptionsLoading(false);
      }
    };

    fetchSubscriptions();
  }, [setSubscriptions, setSubscriptionsLoading]);
};

export default useFetchSubscriptions;
