import React from 'react';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowRight, Brain, Eye, MessageSquare, BarChart3, User } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const teamMembers = [
    {
      name: "Aditya Vikas Pawar",
      email: "aditya.pawar122020@gcoea.ac.in"
    },
    {
      name: "Swastik Gupta", 
      email: "swastik.gupta122020@gcoea.ac.in"
    },
    {
      name: "Atmaram Kambli",
      email: "atmaram.kambli122020@gcoea.ac.in"
    },
    {
      name: "Atharva Pawar",
      email: "atharva.pawar122020@gcoea.ac.in"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Animated Network Background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1920 1080">
          <defs>
            <pattern id="network" patternUnits="userSpaceOnUse" width="100" height="100">
              <circle cx="20" cy="20" r="2" fill="#10b981" opacity="0.6">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="80" cy="40" r="1.5" fill="#10b981" opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="60" cy="80" r="2.5" fill="#10b981" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.9;0.5" dur="4s" repeatCount="indefinite" />
              </circle>
              <line x1="20" y1="20" x2="80" y2="40" stroke="#10b981" strokeWidth="0.5" opacity="0.3">
                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3.5s" repeatCount="indefinite" />
              </line>
              <line x1="80" y1="40" x2="60" y2="80" stroke="#10b981" strokeWidth="0.5" opacity="0.2">
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
              </line>
              <line x1="20" y1="20" x2="60" y2="80" stroke="#10b981" strokeWidth="0.3" opacity="0.1">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="4.5s" repeatCount="indefinite" />
              </line>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#network)" />
        </svg>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6">
        <div className="text-xl font-bold">Product Review AI</div>
        <div className="flex gap-6">
          <Link to="/home" className="hover:text-green-400 transition-colors">Home</Link>
          <Link to="/" className="hover:text-green-400 transition-colors">Dashboard</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 text-center py-20 px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
          Product Review & Visual Categorization
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
          A Final Year Deep Learning Project
        </p>
        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
          <Link to="/" className="flex items-center gap-2">
            Explore Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* About Project Section */}
      <section className="relative z-10 py-20 px-6">
        <Card className="max-w-6xl mx-auto bg-gray-800/80 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-white">
              About Project
            </h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-green-400">Title:</h3>
              <p className="text-lg text-gray-300">
                Product Review and Visual Categorization using Deep Learning
              </p>
            </div>

            <div className="mb-8">
              <p className="text-lg text-gray-300 leading-relaxed">
                This project focuses on analyzing textual product reviews using Natural Language Processing (NLP) 
                and classifying product images using Convolutional Neural Networks (CNNs). Our goal is to build a 
                unified system that understands both visual and textual product data.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-green-400">Institution</h3>
              <div className="text-center">
                <p className="text-lg text-gray-300 mb-2">
                  Government College of Engineering and Research, Avasari Khurd
                </p>
                <p className="text-md text-gray-400 mb-2">
                  Under the guidance of <span className="text-green-400 font-semibold">Prof. K. B. Sadafale</span>
                </p>
                <p className="text-md text-gray-400">
                  Affiliated to <span className="text-green-400 font-semibold">Savitribai Phule Pune University (SPPU)</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6 text-green-400 text-center">Key Features</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Sentiment analysis using pretrained transformers and LSTM-based models</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Image classification with custom CNN architecture and transfer learning</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Web scrapers for review collection from Amazon/Flipkart</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Visualizations for model outputs and predictions</p>
                </div>
                <div className="flex items-start gap-3 md:col-span-2 justify-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Custom chatbot extension for interacting with the system</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Technology Stack
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-800/60 border-gray-700 hover:bg-gray-700/60 transition-colors">
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Deep Learning</h3>
                <p className="text-gray-400 text-sm">Advanced neural networks for analysis</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/60 border-gray-700 hover:bg-gray-700/60 transition-colors">
              <CardContent className="p-6 text-center">
                <Eye className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Computer Vision</h3>
                <p className="text-gray-400 text-sm">Image classification and processing</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/60 border-gray-700 hover:bg-gray-700/60 transition-colors">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">NLP</h3>
                <p className="text-gray-400 text-sm">Natural language processing</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/60 border-gray-700 hover:bg-gray-700/60 transition-colors">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                <p className="text-gray-400 text-sm">Data visualization and insights</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Our Team
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {teamMembers.slice(0, 3).map((member, index) => (
              <Card key={index} className="bg-white border-none shadow-lg w-full max-w-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Fourth member centered below */}
          <div className="flex justify-center mt-6">
            <Card className="bg-white border-none shadow-lg w-full max-w-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{teamMembers[3].name}</h3>
                <p className="text-sm text-gray-600">{teamMembers[3].email}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
          Ready to Explore?
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Dive into our interactive dashboard to see the power of AI-driven product analysis
        </p>
        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
          <Link to="/" className="flex items-center gap-2">
            View Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
};

export default Landing;