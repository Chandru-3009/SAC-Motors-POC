import React, { useEffect, useState } from 'react';

const JobCardService = () => {
  const [sessionData, setSessionData] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [totals, setTotals] = useState(null);
  const [company, setCompany] = useState(null);
  const [jobCardId, setJobCardId] = useState(null);
  const [technician, setTechnician] = useState(null);
  const [customer, setCustomer] = useState(null);
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

  /**
   * Generates car servicing-specific parts data if conversationData is empty.
   * This logic is simplified for demonstration.
   */
  const getServiceParts = (estimatedCost) => {
    // Standard 10,000 km Service Breakdown
    return [
      {
        description: 'Synthetic Engine Oil (5L)',
        cost: estimatedCost * 0.40, // 40% of cost is parts
        labourHours: 0.5 // 30 minutes for oil change
      },
      {
        description: 'Oil Filter & Gasket',
        cost: estimatedCost * 0.15, // 15% of cost is parts
        labourHours: 0 // Included in oil change labour
      },
      {
        description: 'Tire Rotation & Inspection',
        cost: 0, // Purely labour
        labourHours: 1.0 // 60 minutes for tire work
      },
      {
        description: 'Fluid Top-Up & Multi-Point Check',
        cost: estimatedCost * 0.05, // 5% for small fluids/materials
        labourHours: 0.5 // 30 minutes for inspection
      }
    ];
  };

  // Transform session data to job card format
  const transformSessionData = (session) => {
    const conversationData = session.conversationData || {};
    const isCollision = (conversationData.damageDescription || '').toLowerCase().includes('collision') ||
                        (conversationData.damageDescription || '').toLowerCase().includes('crash');

    // --- Company & IDs ---
    const company = {
      name: "SAC MOTOR SERVICE",
      address: `${conversationData.preferredCity || 'Jeddah'} Service Center, Saudi Arabia`,
      tel: "+966 12 345 6789",
      fax: "N/A",
      email: "service@sacmotor.com",
      web: "www.sacmotor.com",
      vat: "KSA-999999",
    };

    const jobCardId = 'SVC-' + (session.sessionId || session.id || 'UNKNOWN').slice(-5).toUpperCase();

    // --- Technician & Job Details ---
    const technician = {
      name: "Faisal Al-Otaibi", // Service Technician
      workOrder: `SVC-${conversationData.preferredCity?.slice(0, 3).toUpperCase() || 'JED'}-${new Date().getFullYear()}-${(session.sessionId || session.id || '').slice(-6)}`,
      defectNumber: isCollision ? "F-BC-01A" : "M-SVC-03B", // Service defect number
      jobDate: new Date(session.createdAt || new Date()).toISOString().split('T')[0],
      damage: conversationData.damageDescription || "Routine Vehicle Maintenance", // Changed default description
      reportedDefect: conversationData.damageDescription || "Vehicle presented for standard oil and filter service.",
    };

    // --- Customer Details ---
    const customer = {
      name: conversationData.fullName || "Anonymous Customer",
      regNo: "ABC-1234", 
      trailerId: conversationData.vehicleMake + ' ' + conversationData.vehicleModel || "HYUNDAI ELANTRA",
      mileage: conversationData.mileage || "50,500 KM", 
      motDue: "2026-03-15",
      completedAction: isCollision 
        ? "Repair work completed as per customer requirements. Quality check passed."
        : "Vehicle serviced as per 50k km schedule. Oil/Filter replaced, tires rotated, and multi-point inspection completed. All checks passed.", // Service-specific completion
    };

    // --- Parts Data Generation ---
    const estimatedCostStr = conversationData.estimatedCost || "850"; // Lower service cost
    const estimatedCost = parseFloat(estimatedCostStr.replace(/[^\d.]/g, '')) || 850;

    let parts = [];

    if (conversationData.detailedBreakdown && conversationData.detailedBreakdown.length > 0) {
        // Use detailed breakdown if provided
        parts = conversationData.detailedBreakdown.map(item => ({
            description: item.part_name,
            cost: item.parts_cost || 0,
            // Assuming 200 SAR/hour labour rate for conversion
            labourHours: (item.labor_cost || 0) / 200 
        }));
    } else {
        // Use Service-specific dummy data if no detailed breakdown is provided
        parts = getServiceParts(estimatedCost);
    }
    
    return {
      company,
      jobCardId,
      technician,
      customer,
      parts,
      labourRate: 200 // SAR per hour
    };
  };


  useEffect(() => {
    const storedData = localStorage.getItem('selectedSessionData');

    // --- Service Scenario Dummy Data (Priority) ---
    const carServicingDummySessionData = {
      sessionId: 'svc-session-002',
      id: 'svc-session-002',
      createdAt: new Date().toISOString(),
      language: 'en',
      conversationData: {
        fullName: 'Sara Al-Khuzaie',
        mobileNumber: '+966 50 987 6543',
        emailAddress: 'sara.k@email.com',
        vehicleMake: 'Hyundai',
        vehicleModel: 'Elantra',
        vehicleYear: '2019',
        damageDescription: 'Routine 50,000 KM Maintenance. Oil change, filter replacement, and tire rotation requested.', 
        isDriveable: true,
        mileage: '50,500 KM',
        estimatedCost: '850', // Base service cost
        preferredCity: 'Jeddah',
        // Provide a detailed breakdown to ensure accurate listing
        detailedBreakdown: [
            { part_name: 'Synthetic Engine Oil (5L)', parts_cost: 300, labor_cost: 100, total: 400 },
            { part_name: 'Oil Filter & Gasket', parts_cost: 80, labor_cost: 0, total: 80 },
            { part_name: 'Air Filter Replacement', parts_cost: 120, labor_cost: 50, total: 170 },
            { part_name: 'Tire Rotation', parts_cost: 0, labor_cost: 200, total: 200 }
        ],
        updatedAt: new Date().toISOString()
      }
    };
    // ---------------------------------------------

    if (!storedData) {
      // Use the service dummy data
      const dummySessionData = carServicingDummySessionData;
      setSessionData(dummySessionData);

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
      setSessionData(parsedData);

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
          <div className="text-red-500 text-sm mb-4">{error || "Could not load job card data."}</div>
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
                <h1 className={`text-2xl font-extrabold text-right mb-4 ${redText}`}>VEHICLE<br />SERVICE CARD</h1>
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
                <Field label="SERVICE TYPE" value={technician.damage} />
                <div className={lineStyle} />
              </div>

              {/* Right Block - Customer & Vehicle Details */}
              <div className="col-span-6">
                <div className={lineStyle} />
                <Field label="CUSTOMER" value={customer.name} />
                <div className={lineStyle} />
                <Field label="REG NO" value={customer.regNo} />
                <div className={lineStyle} />
                <Field label="VEHICLE MODEL" value={customer.trailerId} />
                <div className={lineStyle} />
                <Field label="MILEAGE" value={customer.mileage} />
                <div className={lineStyle} />
                {/* <Field label="MOT DUE" value={customer.motDue} /> */}
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
                  <span className={`text-xs font-semibold ${darkGrayText} uppercase`}>PARTS USED (Oil, Filters, Fluids):</span>
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

export default JobCardService;