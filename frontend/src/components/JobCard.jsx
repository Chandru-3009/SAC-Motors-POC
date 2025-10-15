import React, { useEffect, useState } from 'react';

const JobCard = () => {
  const [sessionData, setSessionData] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [totals, setTotals] = useState(null); // Add totals state
  const [company, setCompany] = useState(null); // Add company state
  const [jobCardId, setJobCardId] = useState(null); // Add jobCardId state
  const [technician, setTechnician] = useState(null); // Add technician state
  const [customer, setCustomer] = useState(null); // Add customer state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const Field = ({ label, value, large = false }) => {
    const darkTextColor = "sac-dark-gray-text";

    return (
      <div className={`flex p-1.5 ${large ? 'flex-col h-full' : 'flex-row items-baseline h-10'}`}>
        <span className={`text-xs font-semibold ${darkTextColor} uppercase ${large ? 'mb-1' : 'w-[140px]'}`}>
          {label}:
        </span>
        <span className={`text-sm font-medium ${darkTextColor} flex-grow ${large ? '' : 'truncate'}`}>
          {value}
        </span>
      </div>
    );
  };

  const calculateTotals = (data) => {
    const partsCost = data.parts.reduce((sum, item) => sum + item.cost, 0);
    const totalLabourHours = data.parts.reduce((sum, item) => sum + item.labourHours, 0);
    const labourCost = totalLabourHours * data.labourRate;
    const totalCost = partsCost + labourCost;
    return { partsCost, totalLabourHours, labourCost, totalCost };
  };

  // Transform session data to job card format
  const transformSessionData = (session) => {
    const conversationData = session.conversationData || {};

    // Default company data
    const company = {
      name: "SAC MOTOR",
      address: `${conversationData.preferredCity || 'Riyadh'} Branch, Saudi Arabia`,
      tel: "+966 12 345 6789",
      fax: "N/A",
      email: "info@sacmotor.com",
      web: "www.sacmotor.com",
      vat: "KSA-999999",
    };

    // Generate job card ID from session ID
    const jobCardId = (session.sessionId || session.id || 'UNKNOWN').slice(-5).toUpperCase();

    // Technician data
    const technician = {
      name: "Ali Mansour", // Default technician
      workOrder: `SAC-${conversationData.preferredCity?.slice(0, 3).toUpperCase() || 'RYD'}-${new Date().getFullYear()}-${(session.sessionId || session.id || '').slice(-6)}`,
      defectNumber: "F-BC-01A",
      jobDate: new Date(session.createdAt || new Date()).toISOString().split('T')[0],
      damage: conversationData.damageDescription || "Collision Damage",
      reportedDefect: conversationData.damageDescription || "Vehicle damage reported by customer",
    };

    // Customer data - map to actual session fields
    const customer = {
      name: conversationData.fullName || "Anonymous Customer",
      regNo: "N/A", // Not available in conversation data
      trailerId: "N/A",
      mileage: "N/A", // Not available in conversation data
      motDue: "N/A", // Not available in conversation data
      completedAction: "Repair work completed as per customer requirements. Quality check passed.",
    };

    // Parts data based on cost estimation
    const parts = [];

    // Parse estimated cost (remove "SAR" and convert to number)
    const estimatedCostStr = conversationData.estimatedCost || "1000";
    const estimatedCost = parseFloat(estimatedCostStr.replace(/[^\d.]/g, '')) || 1000;

    if (conversationData.detailedBreakdown) {
      // If detailed breakdown is available
      conversationData.detailedBreakdown.forEach(item => {
        parts.push({
          description: item.part_name,
          cost: item.parts_cost || 0,
          labourHours: (item.labor_cost || 0) / 200 // Assuming 200 SAR/hour
        });
      });
    } else {
      // Create parts based on damage description and estimated cost
      const damageDesc = (conversationData.damageDescription || "").toLowerCase();

      if (damageDesc.includes('rear') || damageDesc.includes('back')) {
        parts.push({
          description: "Rear Bumper Repair",
          cost: estimatedCost * 0.4,
          labourHours: 2.0
        });
        parts.push({
          description: "Paint & Refinishing",
          cost: estimatedCost * 0.3,
          labourHours: 1.5
        });
        parts.push({
          description: "Miscellaneous Parts",
          cost: estimatedCost * 0.3,
          labourHours: 0.5
        });
      } else if (damageDesc.includes('front')) {
        parts.push({
          description: "Front Bumper Repair",
          cost: estimatedCost * 0.5,
          labourHours: 2.5
        });
        parts.push({
          description: "Paint & Refinishing",
          cost: estimatedCost * 0.3,
          labourHours: 1.5
        });
        parts.push({
          description: "Miscellaneous Parts",
          cost: estimatedCost * 0.2,
          labourHours: 0.5
        });
      } else if (damageDesc.includes('side')) {
        parts.push({
          description: "Side Panel Repair",
          cost: estimatedCost * 0.4,
          labourHours: 2.0
        });
        parts.push({
          description: "Paint & Refinishing",
          cost: estimatedCost * 0.4,
          labourHours: 2.0
        });
        parts.push({
          description: "Miscellaneous Parts",
          cost: estimatedCost * 0.2,
          labourHours: 0.5
        });
      } else {
        // General repair
        parts.push({
          description: "General Repair Parts",
          cost: estimatedCost * 0.6,
          labourHours: 2.0
        });
        parts.push({
          description: "Paint & Refinishing",
          cost: estimatedCost * 0.3,
          labourHours: 1.5
        });
        parts.push({
          description: "Miscellaneous Parts",
          cost: estimatedCost * 0.1,
          labourHours: 0.5
        });
      }
    }

    return {
      company,
      jobCardId,
      technician,
      customer,
      parts,
      labourRate: 200
    };
  };


  useEffect(() => {
    // Read data from localStorage
    console.log("Loading Jobcard page...")
    const storedData = localStorage.getItem('selectedSessionData');

    if (!storedData) {
      // Create dummy session data with relevant values
      const dummySessionData = {
        sessionId: 'demo-session-001',
        id: 'demo-session-001',
        createdAt: new Date().toISOString(),
        language: 'en',
        conversationData: {
          fullName: 'Ahmed Al-Shehri',
          mobileNumber: '+966 50 123 4567',
          emailAddress: 'ahmed.alshehri@email.com',
          vehicleMake: 'Toyota',
          vehicleModel: 'Camry',
          vehicleYear: '2021',
          damageDescription: 'Front bumper crack, left headlight broken, light paint scratches on hood. Vehicle undrivable.',
          isDriveable: false,
          hasWarningLights: true,
          airbagsDeployed: false,
          insuranceClaim: true,
          estimatedCost: '3500',
          preferredCity: 'Riyadh',
          preferredBranch: 'Riyadh Main Branch',
          appointmentTime: 'Morning (8AM-12PM)',
          contactMethod: 'WhatsApp',
          imageUrl: 'http://localhost:3000/uploads/demo-damage-image.jpg',
          detailedBreakdown: [
            {
              part_name: 'Front Bumper',
              parts_cost: 1200,
              labor_cost: 400,
              paint_cost: 300,
              total: 1900
            },
            {
              part_name: 'Left Headlight',
              parts_cost: 850,
              labor_cost: 200,
              paint_cost: 0,
              total: 1050
            },
            {
              part_name: 'Hood Paint',
              parts_cost: 0,
              labor_cost: 150,
              paint_cost: 300,
              total: 450
            }
          ],
          updatedAt: new Date().toISOString()
        }
      };

      console.log('Using dummy session data:', dummySessionData);
      setSessionData(dummySessionData);

      // Transform and set all state variables
      const transformedData = transformSessionData(dummySessionData);
      setJobData(transformedData);
      setTotals(calculateTotals(transformedData));
      setCompany(transformedData.company);
      setJobCardId(transformedData.jobCardId);
      setTechnician(transformedData.technician);
      setCustomer(transformedData.customer);

      setLoading(false);
      return;
    }

    try {
      const parsedData = JSON.parse(storedData);
      console.log('Session data structure:', parsedData);
      console.log('Conversation data:', parsedData.conversationData);
      setSessionData(parsedData);

      // Transform and set all state variables
      const transformedData = transformSessionData(parsedData);
      setJobData(transformedData);
      setTotals(calculateTotals(transformedData));
      setCompany(transformedData.company);
      setJobCardId(transformedData.jobCardId);
      setTechnician(transformedData.technician);
      setCustomer(transformedData.customer);

    } catch (err) {
      setError('Invalid session data format.');
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !sessionData || !jobData || !totals || !company || !jobCardId || !technician || !customer) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <div className="text-red-600 font-semibold mb-2">Error</div>
          <div className="text-red-500 text-sm mb-4">{error}</div>
          <button
            onClick={() => window.history.back()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Now all variables are state variables and React can track them
  // CSS Class variables for readability
  const redBorder = "sac-red-border";
  const redText = "sac-red-text";
  const darkGrayText = "sac-dark-gray-text";
  const redBgFaint = "sac-red-bg-faint";

  // Apply brand red to borders
  const cardBorder = `border-[3px] ${redBorder}`;
  const lineStyle = "border-t border-gray-300";

  return (
    <>
      <style>
        {`
        .sac-red-text {
          color: rgb(235, 62, 55);
        }
        
        .sac-dark-gray-text {
          color: rgb(51, 51, 51);
        }
        
        .sac-red-border {
          border-color: rgb(235, 62, 55);
        }

        .sac-red-bg-faint {
          background-color: rgba(235, 62, 55, 0.1);
        }
        
        .sac-header-bg {
          background-color: rgb(41, 40, 44);
        }
        `}
      </style>

      {/* Centered layout with appropriate vertical spacing */}
      <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center font-inter">

        {/* Job Card Container - Centered and max-w-4xl */}
        <div className='w-full max-w-4xl flex flex-col'>

          {/* Job Card Body */}
          <div className={`w-full bg-white shadow-xl ${cardBorder} flex flex-col`}>

            {/* Company & Job Card Title/ID Section */}
            <div className={`grid grid-cols-12 border-b-2 ${redBorder}`}>

              {/* Company Details (Left Column) */}
              <div className={`col-span-6 p-4 border-r-2 ${redBorder}`}>
                <h1 className={`text-2xl font-extrabold mb-1 ${darkGrayText}`}>{company.name}</h1>
                <p className={`text-xs ${darkGrayText}`}>{company.address}</p>
                <p className={`text-xs ${darkGrayText}`}>Tel: {company.tel} | Fax: {company.fax}</p>
                <p className={`text-xs ${darkGrayText}`}>E-mail: {company.email} | Web: {company.web}</p>
                <p className={`text-xs font-semibold mt-1 ${darkGrayText}`}>VAT Reg No. {company.vat}</p>
              </div>

              {/* Job Card ID (Right Column) */}
              <div className="col-span-6 p-4 flex flex-col items-end">
                <h1 className={`text-2xl font-extrabold text-right mb-4 ${redText}`}>VEHICLE<br />JOB CARD</h1>
                <p className={`text-3xl font-extrabold ${redText}`}>{jobCardId}</p>
              </div>
            </div>

            {/* Main Details Section (Technician vs. Customer) */}
            <div className="grid grid-cols-12">

              {/* Left Block - Technician & Job Details */}
              <div className={`col-span-6 border-r-2 ${redBorder}`}>
                <div className={lineStyle} />
                <Field label="TECHNICIAN" value={technician.name} />
                <div className={lineStyle} />
                <Field label="WORK ORDER" value={technician.workOrder} />
                <div className={lineStyle} />
                <Field label="DEFECT NUMBER" value={technician.defectNumber} />
                <div className={lineStyle} />
                <Field label="JOB DATE" value={technician.jobDate} />
                <div className={lineStyle} />
                <Field label="DAMAGE / WEAR & TEAR" value={technician.damage} />
                <div className={lineStyle} />
              </div>

              {/* Right Block - Customer & Vehicle Details */}
              <div className="col-span-6">
                <div className={lineStyle} />
                <Field label="CUSTOMER" value={customer.name} />
                <div className={lineStyle} />
                <Field label="REG NO" value={customer.regNo} />
                <div className={lineStyle} />
                <Field label="TRAILER / VEHICLE ID" value={customer.trailerId} />
                <div className={lineStyle} />
                <Field label="MILEAGE" value={customer.mileage} />
                <div className={lineStyle} />
                <div className={lineStyle} />
              </div>
            </div>

            {/* Reported Defect vs. Completed Action (Large Text Areas) */}
            <div className={`grid grid-cols-12 h-64 border-t-2 ${redBorder}`}>

              {/* Reported Defect */}
              <div className={`col-span-6 border-r-2 ${redBorder} p-2 h-full`}>
                <Field label="REPORTED DEFECT" value={technician.reportedDefect} large={true} />
              </div>

              {/* Completed Action */}
              <div className="col-span-6 p-2 h-full">
                <Field label="COMPLETED ACTION" value={customer.completedAction} large={true} />
              </div>
            </div>

            {/* Parts and Costs Section */}
            <div className={`grid grid-cols-12 border-t-2 ${redBorder} h-auto`}>

              {/* Parts Used (Left Column) */}
              <div className={`col-span-6 border-r-2 ${redBorder} flex flex-col`}>
                <div className="flex-none h-10 flex items-center px-2 border-b border-gray-300">
                  <span className={`text-xs font-semibold ${darkGrayText} uppercase`}>PARTS USED:</span>
                </div>
                {jobData.parts.map((item, index) => (
                  <div key={index} className="flex-none h-10 flex items-center px-2 border-b border-gray-200">
                    <span className={`text-sm font-medium ${darkGrayText}`}>{item.description} (SAR {item.cost.toFixed(2)})</span>
                  </div>
                ))}
              </div>

              {/* Cost and Labour (Right Column) */}
              <div className="col-span-6 flex flex-col">
                <div className="grid grid-cols-3 flex-none h-10 items-center px-2 border-b border-gray-300">
                  <span className={`text-xs font-semibold ${darkGrayText} uppercase col-span-1`}>COST (SAR):</span>
                  <span className={`text-xs font-semibold ${darkGrayText} uppercase col-span-2 text-right`}>LABOUR (HOURS):</span>
                </div>

                <div className="h-10 flex items-center px-2 border-b border-gray-200 justify-between text-sm">
                  <span className={darkGrayText}>Parts Subtotal:</span>
                  <span className={`font-medium ${darkGrayText}`}>SAR {totals.partsCost.toFixed(2)}</span>
                </div>
                <div className="h-10 flex items-center px-2 border-b border-gray-200 justify-between text-sm">
                  <span className={darkGrayText}>Labour Subtotal ({totals.totalLabourHours.toFixed(2)} Hrs):</span>
                  <span className={`font-medium ${darkGrayText}`}>SAR {totals.labourCost.toFixed(2)}</span>
                </div>

                <div className={`h-10 flex items-center px-2 border-b border-gray-200 justify-between text-sm`}>
                  <span className={darkGrayText}>VAT (15% Est.):</span>
                  <span className={`font-medium ${darkGrayText}`}>SAR {(totals.totalCost * 0.15).toFixed(2)}</span>
                </div>

                <div className={`h-10 flex items-center p-2 text-right ${redBgFaint} flex-none border-b ${redBorder} justify-end`}>
                  <span className={`text-lg font-extrabold uppercase ${redText}`}>TOTAL COST: SAR {(totals.totalCost * 1.15).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default JobCard;