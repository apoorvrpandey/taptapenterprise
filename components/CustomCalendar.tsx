"use client"
import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { Calendar } from "./calendar";

const events = {
  "2024-07-04": ["Independence Day Celebration"],
  "2024-07-10": ["Client Meeting", "Project Deadline"],
  "2024-07-15": ["Team Lunch", "Workshop on New Tech"],
  "2024-07-22": ["Quarterly Review", "Product Launch Prep"],
  "2024-07-30": ["Training Session", "Networking Event"],

  "2024-08-05": ["Marketing Strategy Meeting", "Team Brainstorming Session"],
  "2024-08-10": ["Team Building Event"],
  "2024-08-12": ["Annual Report Review"],
  "2024-08-20": ["Company Picnic", "Product Demo"],
  "2024-08-25": ["Client Feedback Session", "Sales Team Meeting"],

  "2024-09-02": ["Labor Day Weekend"],
  "2024-09-08": ["Product Review", "Staff Meeting"],
  "2024-09-15": ["Conference Call with Partners", "Training Workshop"],
  "2024-09-21": ["Community Outreach Event"],
  "2024-09-30": ["Monthly Performance Review", "Team Outing"],

  "2024-10-01": ["Project Kickoff", "Team Retrospective"],
  "2024-10-08": ["Zoom Call with Design Team", "Orientation Session with New Hires"],
  "2024-10-10": ["Annual Company Meeting", "Client Presentation"],
  "2024-10-15": ["Sales Strategy Review", "Product Brainstorming"],
  "2024-10-22": ["Employee Wellness Day", "Quarterly Financial Review"],
};


export default function CustomCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const days = eachDayOfInterval({
    start: startOfWeek(startDate),
    end: endOfWeek(endDate),
  });

  const handlePreviousMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const monthName = format(currentDate, "MMMM yyyy");

  return (
    <div className="max-w-sm w-full md:w-80 md:fixed md:max-h-[80vh] scrollbar-w-2 scrollbar-track-blue-lighter scrollbar-thumb-blue scrollbar-thumb-rounded overflow-y-auto rounded-xl shadow-lg">
      <div className="p-4 dark:bg-gray-800 bg-white rounded-t-xl">
        <Calendar
          mode="single"
          onDayClick={handleDateClick}
       
        />
      </div>
      <div className=" py-5 px-2.5 dark:bg-gray-700 bg-gray-50 rounded-b">
        <div className="px-2.5">
          {selectedDate ? (
            events[format(selectedDate, "yyyy-MM-dd")] &&
            events[format(selectedDate, "yyyy-MM-dd")].length > 0 ? (
              events[format(selectedDate, "yyyy-MM-dd")].map((event, index) => (
                <div
                  key={index}
                  className="pb-4"
                >
                  <p className="text-xs font-light leading-3 text-gray-500 dark:text-gray-300">
                    9:00 AM
                  </p>
                  <a
                    tabIndex={0}
                    className="focus:outline-none text-lg font-medium leading-5 text-gray-800 dark:text-gray-100 mt-2"
                  >
                    {event}
                  </a>
                  <p className="text-sm pt-2 leading-4  text-gray-600 dark:text-gray-300">
                    Discussion on UX sprint and Wireframe review
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-300">
                No events for this date
              </p>
            )
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              Select a date to see events
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
