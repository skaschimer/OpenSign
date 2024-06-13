import React, { useState } from "react";
import Parse from "parse";
// import FacebookLogin from "react-facebook-login";

const LoginFacebook = ({
  FBCred,
  thirdpartyLoginfn,
  thirdpartyLoader,
  setThirdpartyLoader
}) => {
  const [isModal, setIsModal] = useState(false);
  const [userDetails, setUserDetails] = useState({
    Phone: "",
    Company: "",
    Name: "",
    Email: ""
  });
  const [fBDetails, setFBDetails] = useState({
    Id: "",
    AccessToken: "",
    Name: "",
    Email: ""
  });
  const responseFacebook = async (response) => {
    // console.log("response ", response);
    if (response.userID) {
      setThirdpartyLoader(true);
      const details = {
        Email: response.email,
        Name: response.name
      };
      setUserDetails({ ...userDetails, ...details });
      const fDetails = {
        Id: response.userID,
        AccessToken: response.accessToken,
        Name: response.name,
        Email: response.email
      };
      setFBDetails({ ...fBDetails, ...fDetails });
      const res = await checkExtUser(fDetails);
    }
  };

  const checkExtUser = async (details) => {
    // const extUser = new Parse.Query("contracts_Users");
    // extUser.equalTo("Email", details.Email);
    // const extRes = await extUser.first();
    const params = { email: details.Email };
    const extRes = await Parse.Cloud.run("getUserDetails", params);
    // console.log("extRes ", extRes);
    if (extRes) {
      const params = { ...details, Phone: extRes?.get("Phone") || "" };
      const payload = await Parse.Cloud.run("facebooksign", params);
      //   console.log("payload ", payload);
      if (payload && payload.sessiontoken) {
        const billingDate =
          extRes.get("Next_billing_date") && extRes.get("Next_billing_date");
        // console.log("billingDate expired", billingDate > new Date());
        const LocalUserDetails = {
          name: details.Name,
          email: details.Email,
          phone: extRes?.get("Phone") || "",
          company: extRes.get("Company")
        };
        localStorage.setItem("userDetails", JSON.stringify(LocalUserDetails));
        thirdpartyLoginfn(payload.sessiontoken, billingDate);
      }
      return { msg: "exist" };
    } else {
      setIsModal(true);
      setThirdpartyLoader(false);
      return { msg: "notexist" };
    }
  };
  const handleSubmitbtn = async () => {
    if (userDetails.Phone && userDetails.Company) {
      setThirdpartyLoader(true);
      const params = { ...fBDetails, Phone: userDetails?.Phone || "" };
      const payload = await Parse.Cloud.run("facebooksign", params);
      // console.log("payload ", payload);

      if (payload && payload.sessiontoken) {
        const params = {
          userDetails: {
            name: userDetails.Name,
            email: userDetails.Email,
            // "passsword":userDetails.Phone,
            phone: userDetails?.Phone || "",
            role: "contracts_User",
            company: userDetails.Company
          }
        };
        const userSignUp = await Parse.Cloud.run("usersignup", params);
        // console.log("userSignUp ", userSignUp);
        if (userSignUp && userSignUp.sessionToken) {
          const LocalUserDetails = {
            name: userDetails.Name,
            email: userDetails.Email,
            phone: userDetails?.Phone || "",
            company: userDetails.Company
          };
          localStorage.setItem("userDetails", JSON.stringify(LocalUserDetails));
          thirdpartyLoginfn(userSignUp.sessionToken);
        } else {
          alert(userSignUp.message);
        }
      } else {
        alert("Internal server error !");
      }
    } else {
      alert("Please fill required details!");
    }
  };
  return (
    <div className="relative">
      {thirdpartyLoader && (
        <div className="fixed w-[100vw] h-[100vh] bg-black bg-opacity-30 left-0 top-0 z-[20] text-[50px] text-[#3ac9d6]">
          <div className="loader-37 fixed top-[45%] left-[45%]"></div>
        </div>
      )}
      {/* <FacebookLogin
        appId={FBCred}
        fields="name,email,picture"
        callback={responseFacebook}
        cssClass="btn btn-info btn-md btn-fb"
        icon="fa fa-facebook-f"
      /> */}
      {isModal && (
        <div
          className="modal fade show block z-[1]"
          id="exampleModal"
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Sign up form</h5>
                <span>
                  <span></span>
                </span>
              </div>
              <div className="modal-body">
                <form>
                  <div className="form-group">
                    <label htmlFor="Phone" className="col-form-label">
                      Phone <span className="text-[red] text-[13px]">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="Phone"
                      value={userDetails.Phone}
                      onChange={(e) =>
                        setUserDetails({
                          ...userDetails,
                          Phone: e.target.value
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="Company" className="col-form-label">
                      Company <span className="text-[red] text-[13px]">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="Company"
                      value={userDetails.Company}
                      onChange={(e) =>
                        setUserDetails({
                          ...userDetails,
                          Company: e.target.value
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleSubmitbtn()}
                      className="btn btn-info mr-[10px]"
                    >
                      Sign up
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary w-[90px]"
                      onClick={() => setIsModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginFacebook;
