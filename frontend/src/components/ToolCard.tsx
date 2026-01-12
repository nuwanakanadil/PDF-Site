import React from 'react';
import { ArrowRight } from 'lucide-react';
interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}
export function ToolCard({
  title,
  description,
  icon,
  onClick
}: ToolCardProps) {
  return <div onClick={onClick} className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer flex flex-col h-full">
      <div className="mb-4 p-3 bg-blue-50 text-blue-600 rounded-lg w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
        {icon}
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>

      <p className="text-gray-600 mb-6 flex-grow">{description}</p>

      <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform duration-200">
        Open Tool <ArrowRight className="w-4 h-4 ml-2" />
      </div>
    </div>;
}