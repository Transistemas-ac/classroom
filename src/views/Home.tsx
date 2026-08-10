"use client";

import UserList from "@/src/components/UserList";
import CourseList from "@/src/components/CourseList";
import SubscriptionList from "@/src/components/SubscriptionList";
import { useAuthContext } from "@/src/context/AuthContext";

const Home = () => {
  const { user } = useAuthContext();
  const isAdmin = user?.credentials === "admin";
  const isTeacher = user?.credentials === "teacher";

  return (
    <div className="home-container">
      <div className="main-content">
        {isAdmin ? (
          <>
            <div className="top-section">
              <div className="section users-section">
                <UserList />
              </div>
              <div className="section courses-section">
                <CourseList />
              </div>
            </div>
            <div className="bottom-section">
              <div className="section subscriptions-section">
                <SubscriptionList />
              </div>
            </div>
          </>
        ) : isTeacher ? (
          <>
            <div className="top-section">
              <div className="section courses-section">
                <CourseList />
              </div>
            </div>
            <div className="bottom-section">
              <div className="section subscriptions-section">
                <SubscriptionList />
              </div>
            </div>
          </>
        ) : (
          <div className="top-section">
            <div className="section courses-section">
              <CourseList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
