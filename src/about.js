// About.jsx
import React from "react";
import "./about.css";

// Import components
import Header from "./header";
import Footer from "./footer";

// Import images
import member1 from "./assets/member1.jpg";
import member2 from "./assets/member2.jpg";
import member3 from "./assets/member3.jpg";
import member4 from "./assets/member4.jfif";
import missionVision from "./assets/mission-vision.jpg";
import whyChooseUs from "./assets/why-choose-us.jpg";
import promise1 from "./assets/promise1.jpg";
import promise2 from "./assets/promise2.webp";
import promise3 from "./assets/promise3.jfif";

const About = () => {
  return (
    <div>
      {/* HEADER */}
      <Header />

      {/* About Hero Section */}
      <section className="about-full">
        <div className="overlay"></div>
        <div className="content">
          <span className="brand-pill">Nest & Nook</span>
          <h1 className="hero-title">
            Warm, stylish, and comfortable — furniture for the corners you love.
          </h1>
          <p className="hero-sub">
            Nest & Nook brings warmth, style, and comfort to every corner of your
            home. We curate furniture and home pieces that make your space cozy,
            elegant, and uniquely yours. From chic dorm essentials to timeless
            living room favorites, we help you create corners you’ll love to come
            home to.
          </p>
        </div>
      </section>

      {/* Behind N&N Section */}
      <section className="behind-section">
        <h2 className="behind-title">BEHIND N&N</h2>
        <div className="team-container">
          <div className="team-member">
            <img src={member1} alt="Team Member 1" />
            <div className="member-info">
              <h3>Aroy, Christian Jeuel L.</h3>
              <p>Research & Documentation</p>
            </div>
          </div>
          <div className="team-member">
            <img src={member2} alt="Team Member 2" />
            <div className="member-info">
              <h3>Camiso, John Albert L.</h3>
              <p>Front-end Developer</p>
            </div>
          </div>
          <div className="team-member">
            <img src={member3} alt="Team Member 3" />
            <div className="member-info">
              <h3>Cruz, Kristine Angel G.</h3>
              <p>UI / UX Designer</p>
            </div>
          </div>
          <div className="team-member">
            <img src={member4} alt="Team Member 4" />
            <div className="member-info">
              <h3>Sigua, Kristoffer Daine S.</h3>
              <p>Back-end Developer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="mission-vision">
        <div className="mv-image">
          <img src={missionVision} alt="Mission and Vision" />
        </div>
        <div className="mv-text">
          <h2>MISSION & VISION</h2>
          <div className="mv-content">
            <h3>Mission</h3>
            <p>
              At Nest & Nook Furniture Shop, our mission is to provide stylish,
              functional, and high-quality furniture that transforms every house
              into a comfortable and inviting home. We aim to make furniture
              shopping easy, accessible, and reliable for every Filipino family.
            </p>
            <h3>Vision</h3>
            <p>
              Our vision is to become the go-to online and local furniture
              destination in the Philippines, known for exceptional designs,
              durable products, and outstanding customer service that makes every
              home feel cozy and complete.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-us">
        <div className="wc-text">
          <h2>WHY CHOOSE US</h2>
          <div className="wc-content">
            <p>
              <strong>Quality & Durability:</strong> Every piece of furniture is
              carefully crafted to last while maintaining style and comfort.
            </p>
            <p>
              <strong>Curated Selection:</strong> We offer furniture that fits a
              variety of tastes, from modern minimalism to warm and cozy designs.
            </p>
            <p>
              <strong>Convenient Payment Options:</strong> Shop with confidence
              through Cash on Delivery (COD) or GCash.
            </p>
            <p>
              <strong>Reliable Delivery:</strong> We ensure your furniture
              arrives safely and on time, so you can enjoy your new pieces
              without hassle.
            </p>
            <p>
              <strong>Customer-Centered Service:</strong> Our friendly support
              team is always ready to assist you with questions, recommendations,
              and after-sales support.
            </p>
          </div>
        </div>
        <div className="wc-image">
          <img src={whyChooseUs} alt="Why Choose Us" />
        </div>
      </section>

      {/* Our Promise Section */}
      <section className="our-promise">
        <h2>OUR PROMISE</h2>
        <p>
          At Nest & Nook Furniture Shop, we promise to enhance every home with
          furniture that combines comfort, style, and functionality. From
          browsing to delivery, we are committed to providing a smooth, safe, and
          satisfying shopping experience for all our customers.
        </p>
        <div className="promise-images">
          <img src={promise1} alt="Promise 1" />
          <img src={promise2} alt="Promise 2" />
          <img src={promise3} alt="Promise 3" />
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default About;
