import React from "react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

export default function Footer() {
  return (
    <footer className="bg-gray-dark py-16 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center mb-4 space-x-2">
            <GlobeAltIcon className="h-7 w-7 text-primary" />
            <span className="font-bold text-xl">WebSphere</span>
          </div>
          <p className="text-gray-300 mb-4 leading-relaxed">
            AI-enhanced platform for seamless freelance collaboration, project discovery, and secure work.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-white">Platform</h4>
          <ul className="space-y-3">
            <li>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">Find Talent</a>
            </li>
            <li>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">Find Work</a>
            </li>
            <li>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">How It Works</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-white">Resources</h4>
          <ul className="space-y-3">
            <li>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">Blog</a>
            </li>
            <li>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">FAQs</a>
            </li>
            <li>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">Community</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-white">Company</h4>
          <ul className="space-y-3">
            <li>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">About</a>
            </li>
            <li>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">Contact</a>
            </li>
            <li>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">Privacy Policy</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-600 mt-12 pt-8">
        <div className="text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} WebSphere. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
