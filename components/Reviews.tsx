import React from 'react'
import { CompanyAccordion } from './CompanyAccordion'

export default function Reviews({company}) {
  return (
  <div>
      <div
        style={{
          width: "100%",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          marginTop: "10px",
        }}
      >
        <section
          style={{
            padding: "5px",
            flexDirection: "column",
            display: "flex",
            width: "100%",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              alignSelf: "flex-start",
              textDecoration: "underline",
            }}
          >
            <span className="company-title">{company.company_name}</span>{" "}
            Reviews
          </h1>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              marginTop: "-30px",
              gap: "15px",
            }}
          >
            <h1 style={{ fontSize: "3rem", fontWeight: "700" }}>5.0</h1>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h1>⭐</h1>
              <h1>⭐</h1>
              <h1>⭐</h1>
              <h1>⭐</h1>
              <h1>⭐</h1>
            </div>
          </div>
          <p
            style={{
              fontWeight: "700",
              marginTop: "-30px",
              alignSelf: "flex-start",
            }}
          >
            84% would recommend to a friend
            <br />
            <span style={{ fontSize: "12px", color: "#727272" }}>
              (58653 total reviews)
            </span>
          </p>
          <div
            style={{
              width: "90%",
              backgroundColor: "#F2F4F5",
              padding: "10px",
              textAlign: "start",
              borderRadius: "5px",
            }}
          >
            <span style={{ color: "#73C0ED" }}>ⓘ</span> Companies can't alter or
            remove reviews. (Really!)
            <span
              style={{
                fontWeight: "700",
                color: "#5A0BBF",
                marginLeft: "10px",
              }}
            >
              See how
            </span>{" "}
            Glassdoor protects users and content
          </div>
          <p
            style={{
              fontWeight: "700",
              alignSelf: "flex-start",
              marginTop: "30px",
            }}
          >
            Show more Insights
          </p>
          <div
            style={{ display: "flex", gap: "10px", alignSelf: "flex-start" }}
          >
            <section
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                alignItems: "center",
              }}
            >
              <h1 style={{ fontSize: "3rem", fontWeight: "700" }}>5.0</h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "-70px",
                }}
              >
                <h1>⭐</h1>
                <h1>⭐</h1>
                <h1>⭐</h1>
                <h1>⭐</h1>
                <h1>⭐</h1>
              </div>
            </section>
            <hr
              style={{
                backgroundColor: "#998FFC",
                width: "4px",
                height: "130px",
                borderRadius: "1000px",
                opacity: "0.3",
              }}
            />
            <div
              style={{
                marginLeft: "20px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "-15px",
                }}
              >
                <progress
                  style={{ width: "400px", height: "20px" }}
                  value="75"
                  max="100"
                ></progress>
                <p style={{ fontSize: "12px", fontWeight: "700" }}>
                  5.0 <span style={{ color: "#9BA0A9" }}>14K reviews</span>
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "-15px",
                }}
              >
                <progress
                  style={{ width: "400px", height: "20px" }}
                  value="67"
                  max="100"
                ></progress>
                <p style={{ fontSize: "12px", fontWeight: "700" }}>
                  4.0 <span style={{ color: "#9BA0A9" }}>14K reviews</span>
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "-15px",
                }}
              >
                <progress
                  style={{ width: "400px", height: "20px" }}
                  value="50"
                  max="100"
                ></progress>
                <p style={{ fontSize: "12px", fontWeight: "700" }}>
                  3.0 <span style={{ color: "#9BA0A9" }}>14K reviews</span>
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "-15px",
                }}
              >
                <progress
                  style={{ width: "400px", height: "20px" }}
                  value="25"
                  max="100"
                ></progress>
                <p style={{ fontSize: "12px", fontWeight: "700" }}>
                  1.0 <span style={{ color: "#9BA0A9" }}>14K reviews</span>
                </p>
              </div>
            </div>
          </div>
          <div
            style={{
              alignSelf: "flex-start",
              display: "flex",
              width: "90%",
              alignItems: "center",
              justifyContent: "center",
              gap: "30px",
              marginTop: "10px",
            }}
          >
            <button
              style={{
                paddingLeft: "30px",
                border: "2px solid #EBECF0",
                background: "#F7FCF7",
                paddingRight: "30px",
                color: "black",
              }}
            >
              <span style={{ color: "green" }}>4.0</span> Cleaniess
            </button>
            <button
              style={{
                paddingLeft: "30px",
                border: "2px solid #EBECF0",
                background: "#F7FCF7",
                paddingRight: "30px",
                color: "black",
              }}
            >
              <span style={{ color: "green" }}>4.0</span> Safety and Security
            </button>
            <button
              style={{
                paddingLeft: "30px",
                border: "2px solid #EBECF0",
                background: "#F7FCF7",
                paddingRight: "30px",
                color: "black",
              }}
            >
              <span style={{ color: "green" }}>3.0</span> Ameties
            </button>
            <button
              style={{
                paddingLeft: "30px",
                border: "2px solid #EBECF0",
                background: "#F7FCF7",
                paddingRight: "30px",
                color: "black",
              }}
            >
              <span style={{ color: "green" }}>4.0</span> Location
            </button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginTop: "20px",
            }}
          >
            <img
              src="img/user.png"
              alt="Profile Picture"
              style={{
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                objectFit: "cover",
                marginRight: "15px",
              }}
            />
            <div style={{ flexGrow: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                  Sundaram Murthy
                </span>
                <span style={{ color: "#888" }}>1 Month ago</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.2em",
                    color: "#ffc107",
                    marginLeft: "auto",
                  }}
                >
                  5.0 &#9733;&#9733;&#9733;&#9733;&#9733;
                </div>
              </div>
              <div className="company-about" style={{ marginBottom: "10px" }}>
                Innovative Work Environment:{" "}
                <span className="company-title">{company.company_name}</span> is
                known for its cutting-edge projects and opportunities to work on
                groundbreaking technologies like AI, cloud computing, and more.
              </div>
              <div style={{ display: "flex", gap: "5px" }}>
                <img
                  src="img/googwell2.jpeg"
                  alt="Room Image 1"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "5px",
                    objectFit: "cover",
                  }}
                />
                <img
                  src="img/googlewell.png"
                  alt="Room Image 2"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "5px",
                    objectFit: "cover",
                  }}
                />
                <img
                  src="img/googlefloor.avif"
                  alt="Room Image 3"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "5px",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginTop: "20px",
            }}
          >
            <img
              src="img/user.png"
              alt="Profile Picture"
              style={{
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                objectFit: "cover",
                marginRight: "15px",
              }}
            />
            <div style={{ flexGrow: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                  Sundaram Murthy
                </span>
                <span style={{ color: "#888" }}>1 Month ago</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.2em",
                    color: "#ffc107",
                    marginLeft: "auto",
                  }}
                >
                  5.0 &#9733;&#9733;&#9733;&#9733;&#9733;
                </div>
              </div>
              <div className="company-about" style={{ marginBottom: "10px" }}>
                Innovative Work Environment:{" "}
                <span className="company-title">{company.company_name}</span> is
                known for its cutting-edge projects and opportunities to work on
                groundbreaking technologies like AI, cloud computing, and more.
              </div>
              <div style={{ display: "flex", gap: "5px" }}>
                <img
                  src="img/googwell2.jpeg"
                  alt="Room Image 1"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "5px",
                    objectFit: "cover",
                  }}
                />
                <img
                  src="img/googlewell.png"
                  alt="Room Image 2"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "5px",
                    objectFit: "cover",
                  }}
                />
                <img
                  src="img/googlefloor.avif"
                  alt="Room Image 3"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "5px",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginTop: "20px",
            }}
          >
            <img
              src="img/user.png"
              alt="Profile Picture"
              style={{
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                objectFit: "cover",
                marginRight: "15px",
              }}
            />
            <div style={{ flexGrow: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                  Sundaram Murthy
                </span>
                <span style={{ color: "#888" }}>1 Month ago</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.2em",
                    color: "#ffc107",
                    marginLeft: "auto",
                  }}
                >
                  5.0 &#9733;&#9733;&#9733;&#9733;&#9733;
                </div>
              </div>
              <div className="company-about" style={{ marginBottom: "10px" }}>
                Innovative Work Environment:{" "}
                <span className="company-title">{company.company_name}</span> is
                known for its cutting-edge projects and opportunities to work on
                groundbreaking technologies like AI, cloud computing, and more.
              </div>
              <div style={{ display: "flex", gap: "5px" }}>
                <img
                  src="img/googwell2.jpeg"
                  alt="Room Image 1"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "5px",
                    objectFit: "cover",
                  }}
                />
                <img
                  src="img/googlewell.png"
                  alt="Room Image 2"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "5px",
                    objectFit: "cover",
                  }}
                />
                <img
                  src="img/googlefloor.avif"
                  alt="Room Image 3"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "5px",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
      <CompanyAccordion company={company} />
      <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginTop: '10px' }}>
      <h2 style={{ fontSize: '1.2em', marginBottom: '10px' }}>
        Work at <span className="company-title">{company.company_name}</span>? Share Your Experiences
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <img 
          src={`${company.company_logo}`} 
          className="company-logo" 
          alt="Company Logo" 
          style={{ borderRadius: '5px', width: '50px', height: '50px' }} 
        />
        <div style={{ marginLeft: '10px' }}>
          <h3 style={{ margin: '0', fontSize: '1em' }}>
            <span className="company-title">{company.company_name}</span>
          </h3>
          <p style={{ margin: '0', fontSize: '1.5em', color: '#4caf50' }}>★★★★★</p>
          <p style={{ margin: '0', fontSize: '0.8em', color: '#555' }}>Select a star to rate</p>
        </div>
      </div>
      <textarea
        placeholder="Start your review"
        style={{
          width: '100%',
          height: '100px',
          border: '1px solid #e0e0e0',
          borderRadius: '5px',
          padding: '10px'
        }}
      />
      <div style={{ marginTop: '10px' }}>
        <button
          style={{
            backgroundColor: '#f0f0f0',
            border: '1px solid #e0e0e0',
            borderRadius: '5px',
            padding: '10px',
            marginRight: '5px',
            color: '#000'
          }}
        >
          Add salary
        </button>
        <button
          style={{
            backgroundColor: '#f0f0f0',
            border: '1px solid #e0e0e0',
            borderRadius: '5px',
            padding: '10px',
            marginRight: '5px',
            color: '#000'
          }}
        >
          Add interview
        </button>
        <button
          style={{
            backgroundColor: '#f0f0f0',
            border: '1px solid #e0e0e0',
            borderRadius: '5px',
            padding: '10px',
            color: '#000'
          }}
        >
          Add Benefits
        </button>
      </div>
    </div>
  </div>
  )
}
