import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../auth/auth";

const Signout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    localStorage.removeItem("newLeadsData");
    localStorage.removeItem("deletedLeads");
    localStorage.removeItem("newClientsData");
    localStorage.removeItem("deletedClients");
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
};

export default Signout;
