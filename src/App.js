import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const API_KEYS = { finnhub: "", alphavantage: "", polygon: "", fmp: "" };

const STOCKS = {
  SP500: [
    // ── Technology ────────────────────────────────────────────────────────
    { ticker:"AAPL",  name:"Apple Inc.",               sector:"Technology"       },
    { ticker:"MSFT",  name:"Microsoft Corp.",           sector:"Technology"       },
    { ticker:"NVDA",  name:"NVIDIA Corp.",              sector:"Technology"       },
    { ticker:"GOOGL", name:"Alphabet Inc.",             sector:"Technology"       },
    { ticker:"META",  name:"Meta Platforms",            sector:"Technology"       },
    { ticker:"TSLA",  name:"Tesla Inc.",                sector:"Technology"       },
    { ticker:"AMD",   name:"Advanced Micro Devices",    sector:"Technology"       },
    { ticker:"INTC",  name:"Intel Corp.",               sector:"Technology"       },
    { ticker:"ORCL",  name:"Oracle Corp.",              sector:"Technology"       },
    { ticker:"CRM",   name:"Salesforce Inc.",           sector:"Technology"       },
    { ticker:"ADBE",  name:"Adobe Inc.",                sector:"Technology"       },
    { ticker:"CSCO",  name:"Cisco Systems",             sector:"Technology"       },
    { ticker:"QCOM",  name:"Qualcomm Inc.",             sector:"Technology"       },
    { ticker:"AVGO",  name:"Broadcom Inc.",             sector:"Technology"       },
    { ticker:"TXN",   name:"Texas Instruments",         sector:"Technology"       },
    { ticker:"MU",    name:"Micron Technology",         sector:"Technology"       },
    { ticker:"AMAT",  name:"Applied Materials",         sector:"Technology"       },
    { ticker:"NOW",   name:"ServiceNow Inc.",           sector:"Technology"       },
    { ticker:"PANW",  name:"Palo Alto Networks",        sector:"Technology"       },
    { ticker:"CRWD",  name:"CrowdStrike Holdings",      sector:"Technology"       },
    { ticker:"NET",   name:"Cloudflare Inc.",           sector:"Technology"       },
    { ticker:"SNOW",  name:"Snowflake Inc.",            sector:"Technology"       },
    { ticker:"PLTR",  name:"Palantir Technologies",     sector:"Technology"       },
    { ticker:"UBER",  name:"Uber Technologies",         sector:"Technology"       },
    { ticker:"ARM",   name:"Arm Holdings",              sector:"Technology"       },
    { ticker:"DELL",  name:"Dell Technologies",         sector:"Technology"       },
    { ticker:"HPQ",   name:"HP Inc.",                   sector:"Technology"       },
    { ticker:"IBM",   name:"IBM Corp.",                 sector:"Technology"       },
    { ticker:"INTU",  name:"Intuit Inc.",               sector:"Technology"       },
    { ticker:"KLAC",  name:"KLA Corp.",                 sector:"Technology"       },
    // ── Consumer Discretionary ────────────────────────────────────────────
    { ticker:"AMZN",  name:"Amazon.com Inc.",           sector:"Consumer Disc."   },
    { ticker:"HD",    name:"Home Depot",                sector:"Consumer Disc."   },
    { ticker:"MCD",   name:"McDonald's Corp.",          sector:"Consumer Disc."   },
    { ticker:"NKE",   name:"Nike Inc.",                 sector:"Consumer Disc."   },
    { ticker:"SBUX",  name:"Starbucks Corp.",           sector:"Consumer Disc."   },
    { ticker:"TGT",   name:"Target Corp.",              sector:"Consumer Disc."   },
    { ticker:"LOW",   name:"Lowe's Companies",          sector:"Consumer Disc."   },
    { ticker:"BKNG",  name:"Booking Holdings",          sector:"Consumer Disc."   },
    { ticker:"MAR",   name:"Marriott International",    sector:"Consumer Disc."   },
    { ticker:"GM",    name:"General Motors",            sector:"Consumer Disc."   },
    { ticker:"F",     name:"Ford Motor Co.",            sector:"Consumer Disc."   },
    { ticker:"RIVN",  name:"Rivian Automotive",         sector:"Consumer Disc."   },
    { ticker:"NIO",   name:"NIO Inc.",                  sector:"Consumer Disc."   },
    { ticker:"LYFT",  name:"Lyft Inc.",                 sector:"Consumer Disc."   },
    { ticker:"ABNB",  name:"Airbnb Inc.",               sector:"Consumer Disc."   },
    { ticker:"RCL",   name:"Royal Caribbean Group",     sector:"Consumer Disc."   },
    { ticker:"CCL",   name:"Carnival Corp.",            sector:"Consumer Disc."   },
    { ticker:"CMG",   name:"Chipotle Mexican Grill",    sector:"Consumer Disc."   },
    // ── Consumer Staples ──────────────────────────────────────────────────
    { ticker:"WMT",   name:"Walmart Inc.",              sector:"Consumer Staples" },
    { ticker:"PG",    name:"Procter & Gamble",          sector:"Consumer Staples" },
    { ticker:"KO",    name:"Coca-Cola Co.",             sector:"Consumer Staples" },
    { ticker:"PEP",   name:"PepsiCo Inc.",              sector:"Consumer Staples" },
    { ticker:"COST",  name:"Costco Wholesale",          sector:"Consumer Staples" },
    { ticker:"PM",    name:"Philip Morris Intl.",       sector:"Consumer Staples" },
    { ticker:"MO",    name:"Altria Group",              sector:"Consumer Staples" },
    { ticker:"MDLZ",  name:"Mondelez International",    sector:"Consumer Staples" },
    { ticker:"CL",    name:"Colgate-Palmolive",         sector:"Consumer Staples" },
    // ── Financials ────────────────────────────────────────────────────────
    { ticker:"JPM",   name:"JPMorgan Chase",            sector:"Financials"       },
    { ticker:"BAC",   name:"Bank of America",           sector:"Financials"       },
    { ticker:"WFC",   name:"Wells Fargo",               sector:"Financials"       },
    { ticker:"GS",    name:"Goldman Sachs",             sector:"Financials"       },
    { ticker:"MS",    name:"Morgan Stanley",            sector:"Financials"       },
    { ticker:"C",     name:"Citigroup Inc.",            sector:"Financials"       },
    { ticker:"AXP",   name:"American Express",          sector:"Financials"       },
    { ticker:"V",     name:"Visa Inc.",                 sector:"Financials"       },
    { ticker:"MA",    name:"Mastercard Inc.",           sector:"Financials"       },
    { ticker:"BLK",   name:"BlackRock Inc.",            sector:"Financials"       },
    { ticker:"SCHW",  name:"Charles Schwab",            sector:"Financials"       },
    { ticker:"COIN",  name:"Coinbase Global",           sector:"Financials"       },
    { ticker:"SQ",    name:"Block Inc.",                sector:"Financials"       },
    { ticker:"PYPL",  name:"PayPal Holdings",           sector:"Financials"       },
    { ticker:"BX",    name:"Blackstone Inc.",           sector:"Financials"       },
    { ticker:"HOOD",  name:"Robinhood Markets",         sector:"Financials"       },
    { ticker:"SOFI",  name:"SoFi Technologies",         sector:"Financials"       },
    { ticker:"BRK.B", name:"Berkshire Hathaway B",      sector:"Financials"       },
    { ticker:"KKR",   name:"KKR & Co.",                 sector:"Financials"       },
    { ticker:"APO",   name:"Apollo Global Mgmt.",       sector:"Financials"       },
    // ── Healthcare ────────────────────────────────────────────────────────
    { ticker:"JNJ",   name:"Johnson & Johnson",         sector:"Healthcare"       },
    { ticker:"UNH",   name:"UnitedHealth Group",        sector:"Healthcare"       },
    { ticker:"LLY",   name:"Eli Lilly and Co.",         sector:"Healthcare"       },
    { ticker:"PFE",   name:"Pfizer Inc.",               sector:"Healthcare"       },
    { ticker:"MRK",   name:"Merck & Co.",               sector:"Healthcare"       },
    { ticker:"ABBV",  name:"AbbVie Inc.",               sector:"Healthcare"       },
    { ticker:"AMGN",  name:"Amgen Inc.",                sector:"Healthcare"       },
    { ticker:"MRNA",  name:"Moderna Inc.",              sector:"Healthcare"       },
    { ticker:"GILD",  name:"Gilead Sciences",           sector:"Healthcare"       },
    { ticker:"ISRG",  name:"Intuitive Surgical",        sector:"Healthcare"       },
    { ticker:"VRTX",  name:"Vertex Pharmaceuticals",    sector:"Healthcare"       },
    { ticker:"REGN",  name:"Regeneron Pharma.",         sector:"Healthcare"       },
    { ticker:"BMY",   name:"Bristol-Myers Squibb",      sector:"Healthcare"       },
    { ticker:"TMO",   name:"Thermo Fisher Scientific",  sector:"Healthcare"       },
    { ticker:"ABT",   name:"Abbott Laboratories",       sector:"Healthcare"       },
    // ── Energy ────────────────────────────────────────────────────────────
    { ticker:"XOM",   name:"Exxon Mobil",               sector:"Energy"           },
    { ticker:"CVX",   name:"Chevron Corp.",             sector:"Energy"           },
    { ticker:"COP",   name:"ConocoPhillips",            sector:"Energy"           },
    { ticker:"OXY",   name:"Occidental Petroleum",      sector:"Energy"           },
    { ticker:"SLB",   name:"SLB (Schlumberger)",        sector:"Energy"           },
    { ticker:"HAL",   name:"Halliburton Co.",           sector:"Energy"           },
    { ticker:"DVN",   name:"Devon Energy",              sector:"Energy"           },
    { ticker:"MPC",   name:"Marathon Petroleum",        sector:"Energy"           },
    { ticker:"PSX",   name:"Phillips 66",               sector:"Energy"           },
    { ticker:"VLO",   name:"Valero Energy",             sector:"Energy"           },
    // ── Industrials ───────────────────────────────────────────────────────
    { ticker:"BA",    name:"Boeing Co.",                sector:"Industrials"      },
    { ticker:"CAT",   name:"Caterpillar Inc.",          sector:"Industrials"      },
    { ticker:"DE",    name:"Deere & Company",           sector:"Industrials"      },
    { ticker:"GE",    name:"GE Aerospace",              sector:"Industrials"      },
    { ticker:"UPS",   name:"United Parcel Service",     sector:"Industrials"      },
    { ticker:"FDX",   name:"FedEx Corp.",               sector:"Industrials"      },
    { ticker:"HON",   name:"Honeywell Intl.",           sector:"Industrials"      },
    { ticker:"RTX",   name:"RTX Corp.",                 sector:"Industrials"      },
    { ticker:"LMT",   name:"Lockheed Martin",           sector:"Industrials"      },
    { ticker:"NOC",   name:"Northrop Grumman",          sector:"Industrials"      },
    // ── Communication & Media ─────────────────────────────────────────────
    { ticker:"NFLX",  name:"Netflix Inc.",              sector:"Communication"    },
    { ticker:"DIS",   name:"Walt Disney Co.",           sector:"Communication"    },
    { ticker:"CMCSA", name:"Comcast Corp.",             sector:"Communication"    },
    { ticker:"T",     name:"AT&T Inc.",                 sector:"Communication"    },
    { ticker:"VZ",    name:"Verizon Communications",    sector:"Communication"    },
    { ticker:"TMUS",  name:"T-Mobile US",               sector:"Communication"    },
    { ticker:"SNAP",  name:"Snap Inc.",                 sector:"Communication"    },
    { ticker:"PINS",  name:"Pinterest Inc.",            sector:"Communication"    },
    { ticker:"SPOT",  name:"Spotify Technology",        sector:"Communication"    },
    { ticker:"RBLX",  name:"Roblox Corp.",              sector:"Communication"    },
    // ── ETFs ──────────────────────────────────────────────────────────────
    { ticker:"SPY",   name:"SPDR S&P 500 ETF",          sector:"ETF"              },
    { ticker:"QQQ",   name:"Invesco NASDAQ 100 ETF",    sector:"ETF"              },
    { ticker:"IWM",   name:"iShares Russell 2000 ETF",  sector:"ETF"              },
    { ticker:"GLD",   name:"SPDR Gold Shares ETF",      sector:"ETF"              },
    { ticker:"TLT",   name:"iShares 20Y Treasury ETF",  sector:"ETF"              },
    { ticker:"ARKK",  name:"ARK Innovation ETF",        sector:"ETF"              },
    { ticker:"XLF",   name:"Financial Select Sector",   sector:"ETF"              },
    { ticker:"XLK",   name:"Technology Select Sector",  sector:"ETF"              },
    // ── High Volume / Meme ────────────────────────────────────────────────
    { ticker:"AMC",   name:"AMC Entertainment",         sector:"Consumer Disc."   },
    { ticker:"GME",   name:"GameStop Corp.",             sector:"Consumer Disc."   },
    { ticker:"LCID",  name:"Lucid Group",               sector:"Consumer Disc."   },
    { ticker:"BBAI",  name:"BigBear.ai Holdings",       sector:"Technology"       },
    { ticker:"SOUN",  name:"SoundHound AI",             sector:"Technology"       },
  ],
  TSX: [
    // ── Financials ────────────────────────────────────────────────────────
    { ticker:"RY.TO",    name:"Royal Bank of Canada",        sector:"Financials"       },
    { ticker:"TD.TO",    name:"Toronto-Dominion Bank",       sector:"Financials"       },
    { ticker:"BNS.TO",   name:"Bank of Nova Scotia",         sector:"Financials"       },
    { ticker:"BMO.TO",   name:"Bank of Montreal",            sector:"Financials"       },
    { ticker:"CM.TO",    name:"CIBC",                        sector:"Financials"       },
    { ticker:"NA.TO",    name:"National Bank of Canada",     sector:"Financials"       },
    { ticker:"MFC.TO",   name:"Manulife Financial",          sector:"Financials"       },
    { ticker:"SLF.TO",   name:"Sun Life Financial",          sector:"Financials"       },
    { ticker:"GWO.TO",   name:"Great-West Lifeco",           sector:"Financials"       },
    { ticker:"BN.TO",    name:"Brookfield Corp.",            sector:"Financials"       },
    { ticker:"BAM.TO",   name:"Brookfield Asset Mgmt.",      sector:"Financials"       },
    { ticker:"IFC.TO",   name:"Intact Financial Corp.",      sector:"Financials"       },
    // ── Energy ────────────────────────────────────────────────────────────
    { ticker:"ENB.TO",   name:"Enbridge Inc.",               sector:"Energy"           },
    { ticker:"SU.TO",    name:"Suncor Energy",               sector:"Energy"           },
    { ticker:"CNQ.TO",   name:"Canadian Natural Resources",  sector:"Energy"           },
    { ticker:"TRP.TO",   name:"TC Energy Corp.",             sector:"Energy"           },
    { ticker:"PPL.TO",   name:"Pembina Pipeline",            sector:"Energy"           },
    { ticker:"CVE.TO",   name:"Cenovus Energy",              sector:"Energy"           },
    { ticker:"ARX.TO",   name:"ARC Resources",               sector:"Energy"           },
    { ticker:"BTE.TO",   name:"Baytex Energy",               sector:"Energy"           },
    { ticker:"MEG.TO",   name:"MEG Energy Corp.",            sector:"Energy"           },
    { ticker:"PEY.TO",   name:"Peyto Exploration",           sector:"Energy"           },
    // ── Materials ─────────────────────────────────────────────────────────
    { ticker:"ABX.TO",   name:"Barrick Gold Corp.",          sector:"Materials"        },
    { ticker:"AEM.TO",   name:"Agnico Eagle Mines",          sector:"Materials"        },
    { ticker:"WPM.TO",   name:"Wheaton Precious Metals",     sector:"Materials"        },
    { ticker:"FM.TO",    name:"First Quantum Minerals",      sector:"Materials"        },
    { ticker:"LUN.TO",   name:"Lundin Mining",               sector:"Materials"        },
    { ticker:"NTR.TO",   name:"Nutrien Ltd.",                sector:"Materials"        },
    { ticker:"CS.TO",    name:"Capstone Copper",             sector:"Materials"        },
    { ticker:"IMG.TO",   name:"IAMGOLD Corp.",               sector:"Materials"        },
    { ticker:"K.TO",     name:"Kinross Gold",                sector:"Materials"        },
    // ── Industrials ───────────────────────────────────────────────────────
    { ticker:"CNR.TO",   name:"Canadian National Railway",   sector:"Industrials"      },
    { ticker:"CP.TO",    name:"CP Kansas City",              sector:"Industrials"      },
    { ticker:"WSP.TO",   name:"WSP Global",                  sector:"Industrials"      },
    { ticker:"TIH.TO",   name:"Toromont Industries",         sector:"Industrials"      },
    { ticker:"SNC.TO",   name:"SNC-Lavalin Group",           sector:"Industrials"      },
    { ticker:"STN.TO",   name:"Stantec Inc.",                sector:"Industrials"      },
    // ── Technology ────────────────────────────────────────────────────────
    { ticker:"SHOP.TO",  name:"Shopify Inc.",                sector:"Technology"       },
    { ticker:"CSU.TO",   name:"Constellation Software",      sector:"Technology"       },
    { ticker:"OTEX.TO",  name:"OpenText Corp.",              sector:"Technology"       },
    { ticker:"BB.TO",    name:"BlackBerry Ltd.",             sector:"Technology"       },
    { ticker:"TRI.TO",   name:"Thomson Reuters",             sector:"Technology"       },
    { ticker:"LSPD.TO",  name:"Lightspeed Commerce",         sector:"Technology"       },
    // ── Consumer ──────────────────────────────────────────────────────────
    { ticker:"ATD.TO",   name:"Alimentation Couche-Tard",   sector:"Consumer Staples" },
    { ticker:"L.TO",     name:"Loblaw Companies",            sector:"Consumer Staples" },
    { ticker:"MRU.TO",   name:"Metro Inc.",                  sector:"Consumer Staples" },
    { ticker:"EMP.A.TO", name:"Empire Company",              sector:"Consumer Staples" },
    { ticker:"DOO.TO",   name:"BRP Inc.",                    sector:"Consumer Disc."   },
    { ticker:"CTC.A.TO", name:"Canadian Tire Corp.",         sector:"Consumer Disc."   },
    // ── Telecom ───────────────────────────────────────────────────────────
    { ticker:"BCE.TO",   name:"BCE Inc.",                    sector:"Telecom"          },
    { ticker:"T.TO",     name:"TELUS Corp.",                 sector:"Telecom"          },
    { ticker:"RCI.B.TO", name:"Rogers Communications",       sector:"Telecom"          },
    { ticker:"QBR.B.TO", name:"Quebecor Inc.",               sector:"Telecom"          },
    // ── Utilities ─────────────────────────────────────────────────────────
    { ticker:"FTS.TO",   name:"Fortis Inc.",                 sector:"Utilities"        },
    { ticker:"H.TO",     name:"Hydro One Ltd.",              sector:"Utilities"        },
    { ticker:"AQN.TO",   name:"Algonquin Power",             sector:"Utilities"        },
    { ticker:"EMA.TO",   name:"Emera Inc.",                  sector:"Utilities"        },
    { ticker:"CPX.TO",   name:"Capital Power Corp.",         sector:"Utilities"        },
  ],
};

const INDICES = [
  { symbol:"SPX",  name:"S&P 500",        region:"🇺🇸", ySymbol:"^GSPC"   },
  { symbol:"NDX",  name:"NASDAQ 100",     region:"🇺🇸", ySymbol:"^NDX"    },
  { symbol:"DJI",  name:"Dow Jones",      region:"🇺🇸", ySymbol:"^DJI"    },
  { symbol:"RUT",  name:"Russell 2000",   region:"🇺🇸", ySymbol:"^RUT"    },
  { symbol:"VIX",  name:"CBOE Volatility",region:"🇺🇸", ySymbol:"^VIX"    },
  { symbol:"TXSC", name:"TSX Composite",  region:"🇨🇦", ySymbol:"^GSPTSE" },
  { symbol:"TSX60",name:"TSX 60",         region:"🇨🇦", ySymbol:"^TX60"   },
  { symbol:"DXY",  name:"US Dollar Index",region:"🌐",  ySymbol:"DX-Y.NYB"},
];

const FUTURES = [
  { symbol:"GC=F", name:"Gold",            unit:"$/oz",   category:"Metals"        },
  { symbol:"SI=F", name:"Silver",          unit:"$/oz",   category:"Metals"        },
  { symbol:"HG=F", name:"Copper",          unit:"$/lb",   category:"Metals"        },
  { symbol:"CL=F", name:"Crude Oil (WTI)", unit:"$/bbl",  category:"Energy"        },
  { symbol:"BZ=F", name:"Brent Crude",     unit:"$/bbl",  category:"Energy"        },
  { symbol:"NG=F", name:"Natural Gas",     unit:"$/MMBtu",category:"Energy"        },
  { symbol:"ES=F", name:"S&P 500 E-mini",  unit:"pts",    category:"Index Futures" },
  { symbol:"NQ=F", name:"NASDAQ E-mini",   unit:"pts",    category:"Index Futures" },
  { symbol:"YM=F", name:"Dow E-mini",      unit:"pts",    category:"Index Futures" },
  { symbol:"ZN=F", name:"10-Yr T-Note",    unit:"pts",    category:"Bonds"         },
  { symbol:"ZC=F", name:"Corn",            unit:"¢/bu",   category:"Agriculture"   },
  { symbol:"ZW=F", name:"Wheat",           unit:"¢/bu",   category:"Agriculture"   },
];

// Generates real upcoming Friday expiry dates (weekly + monthly) relative to TODAY.
// This ensures screener contracts are never stale, regardless of when the app runs.
function getUpcomingExpiries() {
  const today = new Date();
  const dates = [];
  // Next 4 weekly Fridays
  for (let w=1; w<=4; w++) {
    const d = new Date(today);
    const dow = d.getDay();
    const daysToFri = (5-dow+7)%7 || 7;
    d.setDate(d.getDate()+daysToFri+(w-1)*7);
    dates.push(d.toISOString().slice(0,10));
  }
  // Next 3 monthly (3rd Friday) expiries
  for (let m=1; m<=3; m++) {
    const d = new Date(today.getFullYear(), today.getMonth()+m, 1);
    let friCount=0;
    while (friCount<3) { if(d.getDay()===5) friCount++; if(friCount<3) d.setDate(d.getDate()+1); }
    dates.push(d.toISOString().slice(0,10));
  }
  return [...new Set(dates)].sort();
}

const OPTIONS_SCREENER = [
  { underlying:"BAC",  name:"Bank of America", expiry:"2025-08-15", strike:40,  type:"CALL", iv:24.1, delta:0.38, gamma:0.04, theta:-0.02, vega:0.08, oi:42100, vol:8200,  premium:0.45, spotPrice:38.90, moneyness:"OTM", risk:2, sector:"Financials",     beginner:true  },
  { underlying:"BAC",  name:"Bank of America", expiry:"2025-08-15", strike:38,  type:"PUT",  iv:26.3, delta:-0.36,gamma:0.04, theta:-0.02, vega:0.08, oi:31200, vol:5900,  premium:0.38, spotPrice:38.90, moneyness:"OTM", risk:2, sector:"Financials",     beginner:true  },
  { underlying:"PFE",  name:"Pfizer",          expiry:"2025-09-19", strike:28,  type:"CALL", iv:29.8, delta:0.40, gamma:0.05, theta:-0.02, vega:0.07, oi:38400, vol:7100,  premium:0.32, spotPrice:27.40, moneyness:"OTM", risk:2, sector:"Healthcare",      beginner:true  },
  { underlying:"PFE",  name:"Pfizer",          expiry:"2025-09-19", strike:27,  type:"PUT",  iv:31.4, delta:-0.42,gamma:0.05, theta:-0.02, vega:0.07, oi:29800, vol:5200,  premium:0.28, spotPrice:27.40, moneyness:"ATM", risk:2, sector:"Healthcare",      beginner:true  },
  { underlying:"XOM",  name:"Exxon Mobil",     expiry:"2025-08-15", strike:120, type:"CALL", iv:22.6, delta:0.35, gamma:0.03, theta:-0.03, vega:0.12, oi:28900, vol:4800,  premium:0.42, spotPrice:118.30,moneyness:"OTM", risk:2, sector:"Energy",          beginner:true  },
  { underlying:"WMT",  name:"Walmart",         expiry:"2025-08-15", strike:90,  type:"CALL", iv:18.4, delta:0.39, gamma:0.04, theta:-0.02, vega:0.09, oi:24200, vol:4100,  premium:0.35, spotPrice:88.70, moneyness:"OTM", risk:1, sector:"Consumer Staples",beginner:true  },
  { underlying:"WMT",  name:"Walmart",         expiry:"2025-08-15", strike:87,  type:"PUT",  iv:19.8, delta:-0.38,gamma:0.04, theta:-0.02, vega:0.09, oi:19100, vol:3200,  premium:0.29, spotPrice:88.70, moneyness:"OTM", risk:1, sector:"Consumer Staples",beginner:true  },
  { underlying:"F",    name:"Ford Motor",      expiry:"2025-07-18", strike:12,  type:"CALL", iv:38.2, delta:0.44, gamma:0.08, theta:-0.03, vega:0.05, oi:89200, vol:22000, premium:0.18, spotPrice:11.42, moneyness:"OTM", risk:3, sector:"Consumer Disc.",  beginner:true  },
  { underlying:"F",    name:"Ford Motor",      expiry:"2025-07-18", strike:11,  type:"PUT",  iv:41.6, delta:-0.46,gamma:0.08, theta:-0.03, vega:0.05, oi:72100, vol:18000, premium:0.22, spotPrice:11.42, moneyness:"ATM", risk:3, sector:"Consumer Disc.",  beginner:true  },
  { underlying:"AAPL", name:"Apple",           expiry:"2025-08-15", strike:220, type:"CALL", iv:27.4, delta:0.38, gamma:0.03, theta:-0.05, vega:0.22, oi:48200, vol:9100,  premium:1.85, spotPrice:213.45,moneyness:"OTM", risk:2, sector:"Technology",      beginner:true  },
  { underlying:"AAPL", name:"Apple",           expiry:"2025-08-15", strike:205, type:"PUT",  iv:29.8, delta:-0.39,gamma:0.03, theta:-0.05, vega:0.22, oi:39100, vol:7200,  premium:1.62, spotPrice:213.45,moneyness:"OTM", risk:2, sector:"Technology",      beginner:true  },
  { underlying:"AAPL", name:"Apple",           expiry:"2025-07-18", strike:215, type:"CALL", iv:28.4, delta:0.46, gamma:0.04, theta:-0.07, vega:0.18, oi:52100, vol:10200, premium:1.42, spotPrice:213.45,moneyness:"OTM", risk:2, sector:"Technology",      beginner:true  },
  { underlying:"JPM",  name:"JPMorgan",        expiry:"2025-08-15", strike:240, type:"CALL", iv:19.8, delta:0.36, gamma:0.02, theta:-0.04, vega:0.18, oi:24100, vol:3900,  premium:1.75, spotPrice:234.80,moneyness:"OTM", risk:1, sector:"Financials",      beginner:true  },
  { underlying:"JPM",  name:"JPMorgan",        expiry:"2025-08-15", strike:230, type:"PUT",  iv:21.4, delta:-0.40,gamma:0.02, theta:-0.04, vega:0.18, oi:18900, vol:3100,  premium:1.48, spotPrice:234.80,moneyness:"OTM", risk:1, sector:"Financials",      beginner:true  },
  { underlying:"AMZN", name:"Amazon",          expiry:"2025-08-15", strike:200, type:"CALL", iv:32.4, delta:0.42, gamma:0.03, theta:-0.06, vega:0.24, oi:38200, vol:8400,  premium:1.95, spotPrice:195.60,moneyness:"OTM", risk:2, sector:"Consumer Disc.",  beginner:true  },
  { underlying:"AMZN", name:"Amazon",          expiry:"2025-08-15", strike:192, type:"PUT",  iv:34.8, delta:-0.41,gamma:0.03, theta:-0.06, vega:0.24, oi:29800, vol:6100,  premium:1.68, spotPrice:195.60,moneyness:"OTM", risk:2, sector:"Consumer Disc.",  beginner:true  },
  { underlying:"SPY",  name:"S&P 500 ETF",     expiry:"2025-07-31", strike:480, type:"CALL", iv:15.8, delta:0.38, gamma:0.02, theta:-0.04, vega:0.28, oi:192000,vol:44000, premium:1.12, spotPrice:485.20,moneyness:"OTM", risk:1, sector:"Index ETF",       beginner:true  },
  { underlying:"SPY",  name:"S&P 500 ETF",     expiry:"2025-07-31", strike:475, type:"PUT",  iv:17.2, delta:-0.36,gamma:0.02, theta:-0.04, vega:0.28, oi:168000,vol:38000, premium:0.98, spotPrice:485.20,moneyness:"OTM", risk:1, sector:"Index ETF",       beginner:true  },
  { underlying:"QQQ",  name:"NASDAQ ETF",      expiry:"2025-07-31", strike:415, type:"CALL", iv:20.8, delta:0.37, gamma:0.02, theta:-0.05, vega:0.32, oi:98000, vol:24000, premium:1.65, spotPrice:408.60,moneyness:"OTM", risk:2, sector:"Index ETF",       beginner:true  },
  { underlying:"TSLA", name:"Tesla",           expiry:"2025-07-18", strike:420, type:"CALL", iv:58.4, delta:0.45, gamma:0.04, theta:-0.18, vega:0.38, oi:84200, vol:28400, premium:5.80, spotPrice:407.50,moneyness:"OTM", risk:4, sector:"Consumer Disc.",  beginner:false },
  { underlying:"TSLA", name:"Tesla",           expiry:"2025-07-18", strike:395, type:"PUT",  iv:62.1, delta:-0.43,gamma:0.04, theta:-0.18, vega:0.38, oi:72100, vol:22100, premium:4.95, spotPrice:407.50,moneyness:"OTM", risk:4, sector:"Consumer Disc.",  beginner:false },
  { underlying:"MSFT", name:"Microsoft",       expiry:"2025-08-15", strike:445, type:"CALL", iv:22.3, delta:0.37, gamma:0.02, theta:-0.06, vega:0.28, oi:29800, vol:5400,  premium:3.40, spotPrice:432.10,moneyness:"OTM", risk:2, sector:"Technology",      beginner:true  },
  { underlying:"NVDA", name:"NVIDIA",          expiry:"2025-07-18", strike:920, type:"CALL", iv:51.4, delta:0.36, gamma:0.01, theta:-0.22, vega:0.58, oi:64200, vol:15800, premium:4.80, spotPrice:875.20,moneyness:"OTM", risk:4, sector:"Technology",      beginner:false },
  { underlying:"GME",  name:"GameStop",        expiry:"2025-07-18", strike:22,  type:"CALL", iv:98.4, delta:0.38, gamma:0.06, theta:-0.08, vega:0.04, oi:88200, vol:32000, premium:0.45, spotPrice:19.84, moneyness:"OTM", risk:4, sector:"Consumer Disc.",  beginner:false },
  { underlying:"PLTR", name:"Palantir",        expiry:"2025-08-15", strike:22,  type:"CALL", iv:62.4, delta:0.42, gamma:0.05, theta:-0.06, vega:0.08, oi:74200, vol:28000, premium:0.88, spotPrice:20.14, moneyness:"OTM", risk:4, sector:"Technology",      beginner:false },
];

const ANALYST_FIRMS = ["Goldman Sachs","Morgan Stanley","TD Securities","RBC Capital","Scotiabank GBM","CIBC","BMO Capital","JPMorgan","UBS","Barclays","Jefferies","Piper Sandler","Canaccord Genuity","Raymond James","National Bank","Desjardins"];
const OPTIONS_ANALYSTS = ["Susquehanna","BTIG","Wedbush Options","Goldman Derivatives","Morgan Stanley Equity Derivatives","Citadel Securities","Wolverine Trading","IMC Financial","Optiver","Flow Traders"];
const CONSENSUS_ORDER = ["Strong Buy","Buy","Hold","Sell","Strong Sell"];
const BUDGET_TIERS = [
  { id:"all",   label:"All",        max:Infinity, color:"#64748b"              },
  { id:"ultra", label:"Under $50",  max:50,       color:"#22c55e"              },
  { id:"mid",   label:"Under $200", max:200,      color:"#3b82f6"              },
  { id:"high",  label:"Under $500", max:500,      color:"#f59e0b"              },
  { id:"spec",  label:"High Risk",  max:Infinity, color:"#ef4444", specOnly:true},
];
const RISK_LABELS = ["","Low","Medium","High","Very High"];
const RISK_COLORS = ["","#22c55e","#f59e0b","#ef4444","#9333ea"];
const MONEYNESS_COLORS = { ITM:"#22c55e", ATM:"#f59e0b", OTM:"#64748b" };
const SEED_PRICES = {
  // US — Technology
  AAPL:213.45, MSFT:432.10, NVDA:875.20, GOOGL:178.35, META:522.75, TSLA:407.50,
  AMD:182.40,  INTC:30.82,  ORCL:148.60, CRM:298.40,   ADBE:458.20, CSCO:54.80,
  QCOM:168.90, AVGO:1342.00,TXN:198.40,  MU:118.60,    AMAT:192.80, NOW:782.40,
  PANW:370.20, CRWD:342.80, NET:92.40,   SNOW:142.60,  PLTR:22.80,  UBER:68.40,
  ARM:128.40,  DELL:128.20, HPQ:34.80,   IBM:182.40,   INTU:648.20, KLAC:792.40,
  // US — Consumer Disc.
  AMZN:195.60, HD:388.45,   MCD:298.40,  NKE:72.80,    SBUX:82.40,  TGT:148.60,
  LOW:228.40,  BKNG:3842.00,MAR:248.60,  GM:48.20,     F:11.42,     RIVN:12.80,
  NIO:5.82,    LYFT:14.20,  ABNB:148.40, RCL:168.20,   CCL:18.40,   CMG:52.80,
  // US — Consumer Staples
  WMT:88.70,   PG:164.20,   KO:62.80,    PEP:168.40,   COST:892.40, PM:98.20,
  MO:44.80,    MDLZ:64.20,  CL:92.40,
  // US — Financials
  JPM:234.80,  BAC:38.90,   WFC:58.40,   GS:482.40,    MS:98.80,    C:62.40,
  AXP:248.60,  V:298.15,    MA:472.80,   BLK:892.40,   SCHW:82.40,  COIN:248.60,
  SQ:82.40,    PYPL:68.20,  BX:148.40,   HOOD:22.40,   SOFI:8.42,   "BRK.B":448.20,
  KKR:128.40,  APO:148.60,
  // US — Healthcare
  JNJ:152.45,  UNH:521.30,  LLY:892.40,  PFE:27.40,    MRK:122.80,  ABBV:182.40,
  AMGN:298.40, MRNA:82.40,  GILD:82.80,  ISRG:428.40,  VRTX:468.20, REGN:892.40,
  BMY:48.20,   TMO:548.40,  ABT:112.80,
  // US — Energy
  XOM:118.30,  CVX:152.40,  COP:118.80,  OXY:62.40,    SLB:42.80,   HAL:38.20,
  DVN:42.40,   MPC:178.60,  PSX:148.40,  VLO:162.80,
  // US — Industrials
  BA:182.40,   CAT:378.40,  DE:392.80,   GE:192.40,    UPS:128.60,  FDX:282.40,
  HON:228.40,  RTX:122.80,  LMT:548.40,  NOC:482.60,
  // US — Communication
  NFLX:682.40, DIS:98.40,   CMCSA:42.80, T:18.42,      VZ:42.80,    TMUS:182.40,
  SNAP:12.42,  PINS:32.80,  SPOT:348.40, RBLX:42.80,
  // US — ETFs
  SPY:485.20,  QQQ:408.60,  IWM:198.40,  GLD:182.40,   TLT:92.80,   ARKK:48.20,
  XLF:42.80,   XLK:198.40,
  // US — High Vol
  AMC:4.82,    GME:24.80,   LCID:3.42,   BBAI:3.82,    SOUN:8.42,
  // TSX — Financials
  "RY.TO":142.30,  "TD.TO":78.45,   "BNS.TO":62.80,  "BMO.TO":124.60, "CM.TO":72.40,
  "NA.TO":112.80,  "MFC.TO":35.80,  "SLF.TO":68.40,  "GWO.TO":42.80,  "BN.TO":62.10,
  "BAM.TO":52.80,  "IFC.TO":228.40,
  // TSX — Energy
  "ENB.TO":57.85,  "SU.TO":54.20,   "CNQ.TO":48.70,  "TRP.TO":52.80,  "PPL.TO":48.20,
  "CVE.TO":22.80,  "ARX.TO":22.40,  "BTE.TO":5.82,   "MEG.TO":22.80,  "PEY.TO":14.80,
  // TSX — Materials
  "ABX.TO":22.15,  "AEM.TO":92.40,  "WPM.TO":62.80,  "FM.TO":18.40,   "LUN.TO":14.80,
  "NTR.TO":62.40,  "CS.TO":8.82,    "IMG.TO":4.82,   "K.TO":8.42,
  // TSX — Industrials
  "CNR.TO":168.20, "CP.TO":112.75,  "WSP.TO":198.40, "TIH.TO":128.80, "SNC.TO":52.40,
  "STN.TO":92.80,
  // TSX — Technology
  "SHOP.TO":128.90,"CSU.TO":3982.00,"OTEX.TO":42.80, "BB.TO":3.82,   "TRI.TO":218.45,
  "LSPD.TO":22.40,
  // TSX — Consumer
  "ATD.TO":82.35,  "L.TO":168.40,   "MRU.TO":82.80,  "EMP.A.TO":38.40,"DOO.TO":82.40,
  "CTC.A.TO":148.20,
  // TSX — Telecom
  "BCE.TO":33.45,  "T.TO":22.80,    "RCI.B.TO":42.40,"QBR.B.TO":32.80,
  // TSX — Utilities
  "FTS.TO":54.80,  "H.TO":38.20,    "AQN.TO":8.42,   "EMA.TO":48.80,  "CPX.TO":42.40,
};
const SEED_INDEX = {
  SPX:{price:4850.20,change:12.40,changeP:0.26},NDX:{price:16920.80,change:45.20,changeP:0.27},
  DJI:{price:38120.60,change:-85.40,changeP:-0.22},RUT:{price:2024.10,change:8.30,changeP:0.41},
  VIX:{price:14.82,change:-0.34,changeP:-2.24},TXSC:{price:21842.30,change:64.10,changeP:0.29},
  TSX60:{price:1324.80,change:3.90,changeP:0.29},DXY:{price:103.84,change:0.22,changeP:0.21},
};
const SEED_FUTURES = {
  "GC=F":{price:2028.40,change:8.20,changeP:0.41},"SI=F":{price:23.14,change:0.18,changeP:0.78},
  "HG=F":{price:3.84,change:-0.02,changeP:-0.52},"CL=F":{price:73.82,change:-0.64,changeP:-0.86},
  "BZ=F":{price:78.94,change:-0.58,changeP:-0.73},"NG=F":{price:2.64,change:0.04,changeP:1.54},
  "ES=F":{price:4862.50,change:14.25,changeP:0.29},"NQ=F":{price:16948.00,change:48.75,changeP:0.29},
  "YM=F":{price:38210.00,change:-62.00,changeP:-0.16},"ZN=F":{price:110.28,change:-0.14,changeP:-0.13},
  "ZC=F":{price:482.50,change:-3.25,changeP:-0.67},"ZW=F":{price:598.75,change:4.50,changeP:0.76},
};

// ─── DATA PROVIDERS ──────────────────────────────────────────────────────────
async function fetchYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const res = await fetch(url, { headers:{ Accept:"application/json" } });
  if (!res.ok) throw new Error("Yahoo fail");
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("No data");
  const price = meta.regularMarketPrice ?? meta.previousClose;
  const prev  = meta.previousClose ?? price;
  return { price, change:+(price-prev).toFixed(2), changeP:+(((price-prev)/prev)*100).toFixed(2),
           high:meta.regularMarketDayHigh, low:meta.regularMarketDayLow,
           open:meta.regularMarketOpen, volume:meta.regularMarketVolume, source:"Yahoo Finance" };
}

// Live options chain from Yahoo Finance
// ─── SYNTHETIC OPTIONS CHAIN GENERATOR ───────────────────────────────────────
// Generates realistic options data when live fetch is unavailable (CORS block)
// Standalone Black-Scholes pricer — used to reprice screener options live against current spot
function blackScholesPrice(S, K, T, iv, isCall) {
  if (!S || !K || T<=0 || !iv) return null;
  const sqT = Math.sqrt(T);
  const nd = (v) => {
    const t = 1/(1+0.2316419*Math.abs(v));
    const p = t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
    return v>=0 ? 1-0.3989422803*Math.exp(-v*v/2)*p : 0.3989422803*Math.exp(-v*v/2)*p;
  };
  const d1 = (Math.log(S/K)+0.5*iv*iv*T)/(iv*sqT), d2 = d1-iv*sqT;
  const N1 = nd(d1), N2 = nd(d2);
  const callP = Math.max(0.01, S*N1-K*N2);
  const putP  = Math.max(0.01, callP-S+K);
  const delta = isCall ? N1 : N1-1;
  const gamma = nd(d1)/(S*iv*sqT) || 0;
  const theta = -(S*nd(d1)*iv/(2*sqT))/365;
  const vega  = S*nd(d1)*sqT/100;
  return { price: isCall?callP:putP, delta, gamma, theta, vega };
}

function generateSyntheticChain(symbol, spotPrice) {
  const S = spotPrice || SEED_PRICES[symbol] || 100;
  const iv = symbol==="TSLA"||symbol==="NVDA"||symbol==="GME"||symbol==="AMC" ? 0.58
           : symbol==="AAPL"||symbol==="MSFT"||symbol==="SPY" ? 0.22
           : symbol.includes(".TO") ? 0.28 : 0.38;

  // Strike step based on price
  const step = S<10?0.5:S<25?1:S<50?2:S<100?2.5:S<200?5:S<500?10:S<1000?25:50;

  // Generate strikes ±20% around spot
  const minK = Math.floor(S*0.80/step)*step;
  const maxK = Math.ceil(S*1.20/step)*step;
  const strikes=[];
  for(let k=minK;k<=maxK;k=+(k+step).toFixed(2)) strikes.push(+k.toFixed(2));

  // Generate 6 expiry timestamps (next 4 weekly Fridays + 2 monthly)
  const today=new Date();
  const expiryDates=[];
  // Weekly
  for(let w=1;w<=4;w++){
    const d=new Date(today);
    const dow=d.getDay(); // 0=Sun
    const daysToFri=(5-dow+7)%7||7;
    d.setDate(d.getDate()+daysToFri+(w-1)*7);
    d.setHours(20,0,0,0);
    expiryDates.push(Math.floor(d.getTime()/1000));
  }
  // Monthly (3rd Friday next 2 months)
  for(let m=1;m<=2;m++){
    const d=new Date(today.getFullYear(),today.getMonth()+m,1);
    let friCount=0;
    while(friCount<3){ if(d.getDay()===5)friCount++; if(friCount<3)d.setDate(d.getDate()+1); }
    d.setHours(20,0,0,0);
    expiryDates.push(Math.floor(d.getTime()/1000));
  }

  const T1=30/365; // ~30 day expiry for pricing
  const sqT=Math.sqrt(T1);

  const bsApprox=(K,isCall)=>{
    const x=Math.log(S/K)/(iv*sqT);
    // Simplified normal CDF approximation
    const nd=(v)=>{const t=1/(1+0.2316419*Math.abs(v));const p=t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return v>=0?1-0.3989422803*Math.exp(-v*v/2)*p:0.3989422803*Math.exp(-v*v/2)*p;};
    const d1=x+0.5*iv*sqT, d2=d1-iv*sqT;
    const N1=nd(d1), N2=nd(d2);
    const callP=Math.max(0.01,S*N1-K*N2);
    const putP=Math.max(0.01,callP-S+K);
    const delta=isCall?N1:N1-1;
    const gamma=nd(d1)/(S*iv*sqT)||0;
    const theta=isCall?-(S*nd(d1)*iv/(2*sqT))/365:-(S*nd(d1)*iv/(2*sqT))/365;
    const vega=S*nd(d1)*sqT/100;
    return {price:isCall?callP:putP, delta, gamma, theta, vega};
  };

  const atmFactor=(K)=>Math.exp(-Math.pow((K-S)/(S*0.08),2));
  const expTs=expiryDates[0];

  const calls=strikes.map(K=>{
    const bs=bsApprox(K,true);
    const spread=Math.max(0.01,bs.price*0.04);
    const af=atmFactor(K);
    const vol=Math.floor(1000+Math.random()*8000*af);
    const oi=Math.floor(2000+Math.random()*40000*af);
    return {
      contractSymbol:`${symbol}C${K}`,
      strike:K, currency:"USD",
      lastPrice:+bs.price.toFixed(2),
      bid:+(bs.price-spread).toFixed(2),
      ask:+(bs.price+spread).toFixed(2),
      change:+(Math.random()*bs.price*0.1-bs.price*0.05).toFixed(2),
      percentChange:+(Math.random()*10-5).toFixed(2),
      volume:vol, openInterest:oi,
      impliedVolatility:+(iv*(1+Math.abs(K-S)/(S*0.5)*0.3)),
      inTheMoney:S>K,
      expiration:expTs,
      delta:+bs.delta.toFixed(4), gamma:+bs.gamma.toFixed(4),
      theta:+bs.theta.toFixed(4), vega:+bs.vega.toFixed(4),
      contractType:"CALL",
    };
  });

  const puts=strikes.map(K=>{
    const bs=bsApprox(K,false);
    const spread=Math.max(0.01,bs.price*0.04);
    const af=atmFactor(K);
    const vol=Math.floor(800+Math.random()*7000*af);
    const oi=Math.floor(1500+Math.random()*35000*af);
    return {
      contractSymbol:`${symbol}P${K}`,
      strike:K, currency:"USD",
      lastPrice:+bs.price.toFixed(2),
      bid:+(bs.price-spread).toFixed(2),
      ask:+(bs.price+spread).toFixed(2),
      change:+(Math.random()*bs.price*0.1-bs.price*0.05).toFixed(2),
      percentChange:+(Math.random()*10-5).toFixed(2),
      volume:vol, openInterest:oi,
      impliedVolatility:+(iv*(1+Math.abs(K-S)/(S*0.5)*0.35)),
      inTheMoney:S<K,
      expiration:expTs,
      delta:+bs.delta.toFixed(4), gamma:+bs.gamma.toFixed(4),
      theta:+bs.theta.toFixed(4), vega:+bs.vega.toFixed(4),
      contractType:"PUT",
    };
  });

  return {
    quote:{ regularMarketPrice:S, regularMarketChangePercent:+(Math.random()*4-2).toFixed(2),
            shortName:symbol, regularMarketVolume:Math.floor(Math.random()*50000000+1000000) },
    expirationDates: expiryDates,
    strikes,
    options:[{ calls, puts, expirationDate:expTs }],
    isSynthetic:true,
  };
}

// ─── LIVE OPTIONS CHAIN FETCHER ───────────────────────────────────────────────
// Tries Yahoo Finance with 3 methods, falls back to realistic synthetic data
// ─── FMP OPTIONS CHAIN (primary live source) ──────────────────────────────────
async function fetchFMPOptions(symbol, expiry) {
  if (!API_KEYS.fmp) throw new Error("No FMP key");
  const sym = symbol.toUpperCase();
  let url = `https://financialmodelingprep.com/api/v4/chain?symbol=${sym}&apikey=${API_KEYS.fmp}`;
  if (expiry) url += `&expiration=${expiry}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`FMP ${res.status}`);
  const data = await res.json();
  if (!data || (!data.callOptions?.length && !data.putOptions?.length &&
                !data.callContracts?.length && !data.putContracts?.length))
    throw new Error("FMP: no options data");
  // Normalise FMP response — field names differ by plan level
  const rawCalls = data.callOptions || data.callContracts || [];
  const rawPuts  = data.putOptions  || data.putContracts  || [];
  const norm = (arr, type) => arr.map(o => ({
    contractSymbol: o.contractSymbol || o.symbol || `${sym}_${type}_${o.strike}`,
    strike:         o.strike || o.strikePrice || 0,
    lastPrice:      o.lastPrice || o.last || o.mark || 0,
    bid:            o.bid  || 0,
    ask:            o.ask  || 0,
    volume:         o.volume || 0,
    openInterest:   o.openInterest || o.openint || 0,
    impliedVolatility: o.impliedVolatility || o.iv || 0,
    delta:          o.delta  || 0,
    gamma:          o.gamma  || 0,
    theta:          o.theta  || 0,
    vega:           o.vega   || 0,
    inTheMoney:     o.inTheMoney || o.itm || false,
    expiration:     o.expiration || o.expirationDate || expiry || "",
  }));
  const calls = norm(rawCalls, "CALL");
  const puts  = norm(rawPuts,  "PUT");
  const expDates = [...new Set([...calls,...puts].map(o=>o.expiration).filter(Boolean))].sort();
  const spotPrice = data.stockPrice || data.underlyingPrice || data.currentPrice
                  || SEED_PRICES[sym] || 100;
  return {
    quote: { regularMarketPrice: spotPrice, symbol: sym },
    expirationDates: expDates.map(d => new Date(d).getTime()/1000),
    strikes: data.strikePrices || [...new Set([...calls,...puts].map(o=>o.strike))].sort((a,b)=>a-b),
    options: [{ calls, puts, expirationDate: expDates[0] }],
    isSynthetic: false,
    source: "FMP",
  };
}

// Validate ticker using FMP quote endpoint
async function validateTickerFMP(symbol) {
  if (!API_KEYS.fmp) return null; // can't validate without key
  const sym = symbol.toUpperCase();
  const res = await fetch(
    `https://financialmodelingprep.com/api/v3/quote/${sym}?apikey=${API_KEYS.fmp}`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { price: data[0].price, name: data[0].name, exchange: data[0].exchange };
}

// Check ticker against local stock list (instant, no API needed)
function validateTickerLocal(symbol) {
  const sym = symbol.toUpperCase();
  const allTickers = [
    ...STOCKS.SP500.map(s=>s.ticker.toUpperCase()),
    ...STOCKS.TSX.map(s=>s.ticker.toUpperCase()),
  ];
  return allTickers.includes(sym) || allTickers.includes(sym+".TO");
}

async function tryFetchLiveChain(sym, qs) {
  // Try FMP first (best CORS support + most complete options data)
  if (API_KEYS.fmp) {
    try {
      const expiry = qs ? new URLSearchParams(qs.replace("?","")).get("date") : null;
      return await fetchFMPOptions(sym, expiry);
    } catch(e) { console.warn("FMP options failed:", e.message); }
  }
  // Try Yahoo Finance direct (works on some networks)
  const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/options/${sym}${qs}`;
  try {
    const res = await fetch(yahooUrl, {
      headers:{ Accept:"application/json" },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const d = await res.json();
      const r = d?.optionChain?.result?.[0];
      if (r?.options?.[0]?.calls?.length) return { ...r, isSynthetic:false, source:"Yahoo" };
    }
  } catch(_){}
  // CORS proxies as last resort
  for (const proxy of [
    `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
  ]) {
    try {
      const res = await fetch(proxy, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const d = await res.json();
        const r = d?.optionChain?.result?.[0];
        if (r?.options?.[0]?.calls?.length) return { ...r, isSynthetic:false, source:"Yahoo(proxy)" };
      }
    } catch(_){}
  }
  return null;
}

// fetchLiveOptionsChain — now handled directly in LiveChainView via tryFetchLiveChain + generateSyntheticChain

async function fetchFMPQuote(symbol) {
  if (!API_KEYS.fmp) throw new Error("No FMP key");
  const sym = symbol.toUpperCase();
  const res = await fetch(`https://financialmodelingprep.com/api/v3/quote/${sym}?apikey=${API_KEYS.fmp}`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`FMP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error("No FMP data");
  const q = data[0];
  if (!q.price) throw new Error("Empty FMP quote");
  return {
    price: q.price, change: +(q.change||0).toFixed(2), changeP: +(q.changesPercentage||0).toFixed(2),
    high: q.dayHigh, low: q.dayLow, open: q.open, volume: q.volume,
    marketCap: q.marketCap, pe: q.pe, eps: q.eps,
    yearHigh: q.yearHigh, yearLow: q.yearLow, avgVolume: q.avgVolume,
    source: "FMP",
  };
}
async function fetchFinnhub(symbol) {
  if (!API_KEYS.finnhub) throw new Error("No key");
  const s = symbol.includes(".TO") ? "TSX:"+symbol.replace(".TO","") : symbol;
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${API_KEYS.finnhub}`);
  const d = await res.json();
  if (!d.c) throw new Error("Empty");
  return { price:d.c, change:+(d.c-d.pc).toFixed(2), changeP:+d.dp.toFixed(2), high:d.h, low:d.l, open:d.o, source:"Finnhub" };
}
async function fetchQuote(symbol) {
  const chain = API_KEYS.fmp ? [fetchFMPQuote, fetchFinnhub, fetchYahoo] : [fetchFinnhub, fetchYahoo];
  for (const fn of chain) { try { return await fn(symbol); } catch(_) {} }
  return null;
}
async function fetchFinnhubRec(symbol) {
  if (!API_KEYS.finnhub) return null;
  const res = await fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol.replace(".TO","")}&token=${API_KEYS.finnhub}`);
  const d = await res.json();
  return Array.isArray(d) && d.length ? d[0] : null;
}
async function fetchFinnhubTarget(symbol) {
  if (!API_KEYS.finnhub) return null;
  const res = await fetch(`https://finnhub.io/api/v1/stock/price-target?symbol=${symbol.replace(".TO","")}&token=${API_KEYS.finnhub}`);
  const d = await res.json();
  return d?.targetMean ?? null;
}

// ─── SEED HELPERS ─────────────────────────────────────────────────────────────
function rng(seed) { let s=seed; return ()=>{ s=(s*9301+49297)%233280; return s/233280; }; }
function seedRatings(ticker, target) {
  const r=rng(ticker.split("").reduce((a,c)=>a+c.charCodeAt(0),0));
  const count=6+Math.floor(r()*8), bias=r();
  return Array.from({length:count},()=>{
    const v=r(); let rating;
    if(bias>0.65) rating=v<0.45?"Strong Buy":v<0.80?"Buy":v<0.92?"Hold":v<0.97?"Sell":"Strong Sell";
    else if(bias>0.35) rating=v<0.20?"Strong Buy":v<0.50?"Buy":v<0.80?"Hold":v<0.93?"Sell":"Strong Sell";
    else rating=v<0.05?"Strong Buy":v<0.20?"Buy":v<0.48?"Hold":v<0.75?"Sell":"Strong Sell";
    return { firm:ANALYST_FIRMS[Math.floor(r()*ANALYST_FIRMS.length)], rating, daysAgo:Math.floor(r()*60)+1, target:target??null, targetMult:0.82+r()*0.44 };
  });
}
function seedOptionsRatings(key) {
  const r=rng(key.split("").reduce((a,c)=>a+c.charCodeAt(0),0));
  const ratings=["Strong Buy","Buy","Buy","Hold","Sell"];
  return Array.from({length:4+Math.floor(r()*4)},()=>({ firm:OPTIONS_ANALYSTS[Math.floor(r()*OPTIONS_ANALYSTS.length)], rating:ratings[Math.floor(r()*ratings.length)], daysAgo:Math.floor(r()*14)+1, targetPremium:(2+r()*18).toFixed(2) }));
}
function seedIndexRatings(symbol) {
  const r=rng(symbol.split("").reduce((a,c)=>a+c.charCodeAt(0),0));
  return Array.from({length:5+Math.floor(r()*6)},()=>({ firm:ANALYST_FIRMS[Math.floor(r()*ANALYST_FIRMS.length)], outlook:["Bullish","Neutral","Bearish"][Math.floor(r()*3)], target:(r()*8-2).toFixed(1), daysAgo:Math.floor(r()*30)+1 }));
}
function seedFuturesRatings(symbol) {
  const r=rng(symbol.split("").reduce((a,c)=>a+c.charCodeAt(0),0));
  return Array.from({length:4+Math.floor(r()*5)},()=>({ firm:ANALYST_FIRMS[Math.floor(r()*ANALYST_FIRMS.length)], rating:["Strong Buy","Buy","Hold","Sell"][Math.floor(r()*4)], target12m:(r()*0.3-0.05).toFixed(2), daysAgo:Math.floor(r()*45)+1 }));
}
function calcConsensus(ratings) {
  const w={"Strong Buy":5,"Buy":4,"Hold":3,"Sell":2,"Strong Sell":1};
  const score=ratings.reduce((a,r)=>a+(w[r.rating]||3),0)/ratings.length;
  return score>=4.3?"Strong Buy":score>=3.6?"Buy":score>=2.6?"Hold":score>=1.8?"Sell":"Strong Sell";
}
function consensusFromFinnhub(d) {
  const total=(d.strongBuy||0)+(d.buy||0)+(d.hold||0)+(d.sell||0)+(d.strongSell||0);
  if(!total) return null;
  const score=((d.strongBuy||0)*5+(d.buy||0)*4+(d.hold||0)*3+(d.sell||0)*2+(d.strongSell||0))/total;
  return score>=4.3?"Strong Buy":score>=3.6?"Buy":score>=2.6?"Hold":score>=1.8?"Sell":"Strong Sell";
}

// ─── STYLE TOKENS ─────────────────────────────────────────────────────────────
const BADGE={"Strong Buy":{bg:"#16a34a"},"Buy":{bg:"#15803d"},"Hold":{bg:"#ca8a04"},"Sell":{bg:"#dc2626"},"Strong Sell":{bg:"#991b1b"},"Bullish":{bg:"#16a34a"},"Neutral":{bg:"#ca8a04"},"Bearish":{bg:"#dc2626"},"CALL":{bg:"#1d4ed8"},"PUT":{bg:"#9333ea"}};
const BAR={"Strong Buy":"#22c55e","Buy":"#4ade80","Hold":"#facc15","Sell":"#f87171","Strong Sell":"#ef4444"};
const SRC={"Finnhub":"#00d4aa","Yahoo Finance":"#8b5cf6","Seed Data":"#475569"};
const CAT_COLOR={"Metals":"#f59e0b","Energy":"#ef4444","Index Futures":"#3b82f6","Bonds":"#22c55e","Agriculture":"#84cc16"};

function Badge({label,size="sm"}) {
  const c=BADGE[label]||{bg:"#475569"};
  return <span style={{background:c.bg,color:"#fff",borderRadius:4,padding:size==="lg"?"5px 13px":"3px 8px",fontSize:size==="lg"?12:10,fontWeight:800,letterSpacing:0.4,fontFamily:"monospace",whiteSpace:"nowrap"}}>{label}</span>;
}
function SourcePill({source}) {
  const c=SRC[source]||"#64748b";
  return <span style={{background:`${c}22`,color:c,border:`1px solid ${c}44`,borderRadius:10,padding:"2px 7px",fontSize:10,fontWeight:600}}>{source}</span>;
}
function BreakdownBar({ratings}) {
  const counts={}; CONSENSUS_ORDER.forEach(r=>counts[r]=0); ratings.forEach(r=>counts[r.rating]++);
  return <div style={{display:"flex",gap:2,borderRadius:4,overflow:"hidden",height:6,marginTop:8}}>{CONSENSUS_ORDER.map(r=>counts[r]>0&&<div key={r} style={{flex:counts[r]/ratings.length,background:BAR[r]}}/>)}</div>;
}
function Skeleton() {
  return <div style={{height:4,background:"#1e293b",borderRadius:2,overflow:"hidden",marginTop:12}}>
    <div style={{height:"100%",width:"40%",background:"#3b82f6",borderRadius:2,animation:"slide 1.2s ease-in-out infinite"}}/>
    <style>{`@keyframes slide{0%{margin-left:-40%}100%{margin-left:100%}}`}</style>
  </div>;
}
function PctBadge({v}) {
  const n=parseFloat(v); const up=n>=0;
  return <span style={{fontSize:12,color:up?"#22c55e":"#ef4444",fontWeight:700}}>{up?"▲":"▼"} {Math.abs(n).toFixed(2)}%</span>;
}

// ─── P&L PAYOFF CHART (SVG) ─────────────────────────────────────────────────
function PayoffChart({strike,premium,type,spotPrice}) {
  const isCall=type==="CALL";
  const contractCost=+(premium*100).toFixed(2);
  const lo=spotPrice*0.72, hi=spotPrice*1.28;
  const steps=60;
  const pts=Array.from({length:steps+1},(_,i)=>{
    const price=lo+(hi-lo)*(i/steps);
    const pnl=isCall?Math.max(0,price-strike)*100-contractCost:Math.max(0,strike-price)*100-contractCost;
    return {price,pnl};
  });
  const minPnl=Math.min(...pts.map(p=>p.pnl));
  const maxPnl=Math.max(...pts.map(p=>p.pnl));
  const range=maxPnl-minPnl||1;
  const W=280, H=130;
  const tx=p=>((p-lo)/(hi-lo))*W;
  const ty=p=>H-((p-minPnl)/range)*H;
  const zY=ty(0);
  const pathD=pts.map((p,i)=>`${i===0?"M":"L"} ${tx(p.price).toFixed(1)} ${ty(p.pnl).toFixed(1)}`).join(" ");
  const be=isCall?strike+premium:strike-premium;
  const beX=tx(be), spX=tx(spotPrice);
  return (
    <div style={{background:"#0a1628",borderRadius:8,padding:"10px 8px 6px"}}>
      <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>P&L at Expiry</div>
      <svg width="100%" viewBox={`-20 -10 ${W+40} ${H+30}`} style={{overflow:"visible"}}>
        <defs>
          <clipPath id="profitClip"><rect x={0} y={0} width={W} height={zY}/></clipPath>
          <clipPath id="lossClip"><rect x={0} y={zY} width={W} height={H-zY}/></clipPath>
        </defs>
        <path d={`${pathD} L ${W} ${zY} L 0 ${zY} Z`} fill="#22c55e18" clipPath="url(#profitClip)"/>
        <path d={`${pathD} L ${W} ${zY} L 0 ${zY} Z`} fill="#ef444418" clipPath="url(#lossClip)"/>
        <line x1={0} y1={zY} x2={W} y2={zY} stroke="#334155" strokeDasharray="4,3" strokeWidth={1}/>
        <path d={pathD} stroke={isCall?"#3b82f6":"#9333ea"} strokeWidth={2.5} fill="none" strokeLinejoin="round"/>
        <line x1={spX} y1={-10} x2={spX} y2={H+10} stroke="#64748b" strokeDasharray="3,3" strokeWidth={1}/>
        <line x1={beX} y1={-10} x2={beX} y2={H+10} stroke="#f59e0b" strokeDasharray="3,3" strokeWidth={1}/>
        <text x={beX} y={H+22} textAnchor="middle" fill="#f59e0b" fontSize={9} fontWeight="bold">BE ${be.toFixed(0)}</text>
        <text x={spX} y={-4} textAnchor="middle" fill="#64748b" fontSize={9}>Now</text>
        <text x={-4} y={zY+4} textAnchor="end" fill="#64748b" fontSize={8}>$0</text>
        {maxPnl>0&&<text x={-4} y={10} textAnchor="end" fill="#22c55e" fontSize={8}>+${maxPnl.toFixed(0)}</text>}
        <text x={-4} y={H} textAnchor="end" fill="#ef4444" fontSize={8}>-${contractCost}</text>
      </svg>
      <div style={{display:"flex",justifyContent:"space-around",marginTop:4}}>
        <span style={{fontSize:9,color:"#64748b"}}>⬛ Loss zone</span>
        <span style={{fontSize:9,color:"#f59e0b"}}>— Breakeven</span>
        <span style={{fontSize:9,color:"#64748b"}}>— Current price</span>
      </div>
    </div>
  );
}

// ─── VOLUME DONUT CHART (SVG) ─────────────────────────────────────────────────
function VolumeDonut({callVol,putVol}) {
  const total=callVol+putVol||1;
  const callPct=callVol/total, putPct=putVol/total;
  const R=38, cx=50, cy=50, strokeW=16;
  const circ=2*Math.PI*R;
  const callDash=circ*callPct, putDash=circ*putPct;
  const fmt=n=>n>=1000000?`${(n/1000000).toFixed(2)}M`:n>=1000?`${(n/1000).toFixed(0)}K`:n;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1e293b" strokeWidth={strokeW}/>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#9333ea" strokeWidth={strokeW}
          strokeDasharray={`${putDash} ${circ-putDash}`} strokeDashoffset={circ*0.25}
          transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#3b82f6" strokeWidth={strokeW}
          strokeDasharray={`${callDash} ${circ-callDash}`} strokeDashoffset={circ*0.25+putDash}
          transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round"/>
        <text x={cx} y={cy-5} textAnchor="middle" fill="#f1f5f9" fontSize={10} fontWeight="bold">C/P</text>
        <text x={cx} y={cy+8} textAnchor="middle" fill="#94a3b8" fontSize={8}>{(callPct*100).toFixed(0)}/{(putPct*100).toFixed(0)}%</text>
      </svg>
      <div style={{flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:11,color:"#3b82f6",fontWeight:700}}>Calls Vol.</span>
          <span style={{fontSize:11,color:"#3b82f6",fontWeight:700}}>{fmt(callVol)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:"#9333ea",fontWeight:700}}>Puts Vol.</span>
          <span style={{fontSize:11,color:"#9333ea",fontWeight:700}}>{fmt(putVol)}</span>
        </div>
        <div style={{marginTop:6,fontSize:10,color:"#475569"}}>
          {callVol>putVol?"⬆️ Bullish bias (more calls)":"⬇️ Bearish bias (more puts)"}
        </div>
      </div>
    </div>
  );
}

// ─── LIVE OPTIONS CHAIN VIEW ──────────────────────────────────────────────────
function LiveChainView() {
  const [ticker,setTicker]=useState("TSLA");
  const [inputTicker,setInputTicker]=useState("TSLA");
  const [chainData,setChainData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [tickerStatus,setTickerStatus]=useState(null); // null|"valid"|"invalid"|"checking"
  const [tickerInfo,setTickerInfo]=useState(null);     // {price,name,exchange}
  const [selectedExpiry,setSelectedExpiry]=useState(null);
  const [selectedOpt,setSelectedOpt]=useState(null);
  const [showReport,setShowReport]=useState(false);
  const [view,setView]=useState("stats"); // stats | chain

  const load=async(sym,date)=>{
    setLoading(true); setError(null); setChainData(null); setSelectedOpt(null);

    // ── Step 1: Validate ticker ───────────────────────────────────────────
    setTickerStatus("checking");
    const isLocallyKnown = validateTickerLocal(sym);
    if (isLocallyKnown) {
      setTickerStatus("valid");
    } else if (API_KEYS.fmp) {
      // Validate against FMP
      const info = await validateTickerFMP(sym).catch(()=>null);
      if (info) { setTickerStatus("valid"); setTickerInfo(info); }
      else {
        setTickerStatus("invalid");
        setError(`"${sym}" is not a recognised ticker symbol. Please check the spelling and try again.`);
        setLoading(false);
        return;
      }
    } else {
      // No FMP key — allow but warn
      setTickerStatus("valid");
    }

    // ── Step 2: Show synthetic data instantly while fetching ──────────────
    const cleanSym = sym.toUpperCase().replace(".TO","");
    const spot = SEED_PRICES[cleanSym] || SEED_PRICES[sym] || tickerInfo?.price || 100;
    const synth = generateSyntheticChain(cleanSym, spot);
    setChainData(synth);
    if (!date && synth.expirationDates?.length) setSelectedExpiry(synth.expirationDates[0]);
    setError("synthetic");
    setLoading(false);

    // ── Step 3: Fetch real data from FMP / Yahoo in background ───────────
    if (!API_KEYS.fmp) { setError("no_fmp_key"); return; }
    setError("fetching");
    try {
      const live = await tryFetchLiveChain(cleanSym, date ? `?date=${date}` : "");
      if (live && live.options?.[0]?.calls?.length) {
        setChainData({ ...live, isSynthetic: false });
        if (!date && live.expirationDates?.length) setSelectedExpiry(live.expirationDates[0]);
        setError(null);
      } else {
        setError("synthetic");
      }
    } catch(_) { setError("synthetic"); }
  };

  useEffect(()=>{ load(ticker); },[ticker]);

  const handleSearch=()=>{
    const t=inputTicker.trim().toUpperCase();
    if(!t) return;
    // Basic format check — must be 1-6 letters optionally ending in .TO
    if(!/^[A-Z]{1,6}(\.TO|\.B\.TO|\.A\.TO|\.B)?$/.test(t) && !/^[A-Z]{1,5}\.[A-Z]$/.test(t)) {
      setTickerStatus("invalid");
      setError(`"${t}" doesn't look like a valid ticker symbol.`);
      return;
    }
    setTicker(t); setSelectedOpt(null);
  };

  const calls=chainData?.options?.[0]?.calls||[];
  const puts=chainData?.options?.[0]?.puts||[];
  const underlying=chainData?.quote;
  const spotPrice=underlying?.regularMarketPrice||0;
  const totalCallVol=calls.reduce((a,c)=>a+(c.volume||0),0);
  const totalPutVol=puts.reduce((a,p)=>a+(p.volume||0),0);
  const totalCallOI=calls.reduce((a,c)=>a+(c.openInterest||0),0);
  const totalPutOI=puts.reduce((a,p)=>a+(p.openInterest||0),0);
  const totalVol=totalCallVol+totalPutVol;
  const totalOI=totalCallOI+totalPutOI;
  const fmt=n=>n>=1000000?`${(n/1000000).toFixed(2)}M`:n>=1000?`${(n/1000).toFixed(1)}K`:`${n}`;

  if(selectedOpt) {
    const o=selectedOpt;
    const isCall=o.contractType==="CALL"||o.contractSymbol?.includes("C");
    const premium=(o.lastPrice||o.ask||0);
    const contractCost=(premium*100).toFixed(2);
    const breakeven=isCall?(o.strike+premium).toFixed(2):(o.strike-premium).toFixed(2);
    const pctBE=spotPrice?Math.abs((parseFloat(breakeven)-spotPrice)/spotPrice*100).toFixed(1):null;
    const iv=((o.impliedVolatility||0)*100).toFixed(1);
    const delta=o.delta?.toFixed(4)||"—";
    const theta=o.theta?.toFixed(4)||"—";
    const gamma=o.gamma?.toFixed(4)||"—";
    const vega=o.vega?.toFixed(4)||"—";
    return (
      <div style={{padding:"0 0 16px"}}>
        <button onClick={()=>setSelectedOpt(null)} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:12,marginBottom:12}}>← Back to Chain</button>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
          <span style={{fontFamily:"monospace",fontWeight:900,fontSize:18,color:"#f8fafc"}}>{ticker}</span>
          <Badge label={isCall?"CALL":"PUT"} size="lg"/>
          <span style={{fontFamily:"monospace",color:"#94a3b8",fontSize:14}}>${o.strike} · Exp {o.expiration?new Date(o.expiration*1000).toISOString().slice(0,10):"—"}</span>
        </div>

        <button onClick={()=>setShowReport(true)} style={{width:"100%",marginBottom:14,padding:"11px 16px",background:"linear-gradient(135deg,#1d4ed8,#0c2040)",border:"1px solid #3b82f6",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <span>📊</span> Generate Full Analyst Report with Conviction Evidence
        </button>

        {/* Cost box */}
        <div style={{background:"linear-gradient(135deg,#0f2744,#1a1040)",border:"1px solid #1e40af",borderRadius:10,padding:14,marginBottom:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><div style={{fontSize:10,color:"#64748b"}}>Premium / share</div><div style={{fontSize:22,fontWeight:900,color:isCall?"#60a5fa":"#c084fc"}}>${premium.toFixed(2)}</div></div>
            <div><div style={{fontSize:10,color:"#64748b"}}>1 Contract cost</div><div style={{fontSize:22,fontWeight:900,color:"#f1f5f9"}}>${contractCost}</div><div style={{fontSize:9,color:"#475569"}}>= max loss</div></div>
          </div>
        </div>

        {/* Key metrics */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          {[
            {l:"Breakeven",v:`$${breakeven}`,s:pctBE?`${pctBE}% ${isCall?"above":"below"} now`:null,sc:"#f59e0b"},
            {l:"Max Loss",v:`-$${contractCost}`,s:"your full premium",sc:"#ef4444"},
            {l:"Max Profit",v:isCall?"Unlimited":`$${(o.strike*100-parseFloat(contractCost)).toFixed(0)}`,s:isCall?"if stock keeps rising":"if stock goes to $0",sc:"#22c55e"},
            {l:"Impl. Volatility",v:`${iv}%`,s:parseFloat(iv)>50?"High IV — expensive":"Normal IV",sc:parseFloat(iv)>50?"#ef4444":"#22c55e"},
          ].map(m=>(
            <div key={m.l} style={{background:"#1e293b",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:10,color:"#64748b"}}>{m.l}</div>
              <div style={{fontSize:15,fontWeight:800,color:"#f1f5f9"}}>{m.v}</div>
              {m.s&&<div style={{fontSize:10,color:m.sc}}>{m.s}</div>}
            </div>
          ))}
        </div>

        {/* Greeks */}
        <div style={{background:"#1e293b",borderRadius:8,padding:"12px 14px",marginBottom:10}}>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Greeks</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
            {[{l:"Delta",v:delta,tip:"Price sens."},{l:"Theta",v:theta,tip:"Time decay/day"},{l:"Gamma",v:gamma,tip:"Delta change rate"},{l:"Vega",v:vega,tip:"IV sensitivity"}].map(g=>(
              <div key={g.l} style={{background:"#0f172a",borderRadius:6,padding:"8px 6px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#64748b"}}>{g.l}</div>
                <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{g.v}</div>
                <div style={{fontSize:8,color:"#374151"}}>{g.tip}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payoff Chart */}
        <PayoffChart strike={o.strike} premium={premium} type={isCall?"CALL":"PUT"} spotPrice={spotPrice||o.strike}/>

        {/* Education */}
        <div style={{background:"#0c1a2e",border:"1px solid #1e3a5f",borderRadius:8,padding:12,fontSize:10,color:"#64748b",lineHeight:1.8,marginTop:10}}>
          <div style={{color:"#3b82f6",fontWeight:700,marginBottom:4}}>📚 Quick Guide</div>
          <div><strong style={{color:"#94a3b8"}}>Delta {delta}:</strong> Option moves ${Math.abs(parseFloat(delta)||0).toFixed(2)} for every $1 in stock</div>
          <div><strong style={{color:"#94a3b8"}}>Theta {theta}:</strong> Loses ~${Math.abs(parseFloat(theta)||0).toFixed(2)} in value per day</div>
          <div><strong style={{color:"#94a3b8"}}>IV {iv}%:</strong> {parseFloat(iv)>50?"High — market expects big moves":"Normal — market is calm"}</div>
          <div style={{marginTop:4,color:"#374151"}}>⚠️ {chainData?.isSynthetic===false?`Live data from ${chainData.source||"FMP"}.`:"Model-based data (Black-Scholes)."} Not financial advice.</div>
        </div>
        {showReport&&<AnalystReportModal subject={{
          ticker:`${ticker} $${o.strike} ${isCall?"CALL":"PUT"}`, name:tickerInfo?.name||ticker, category:isCall?"Call Option":"Put Option", assetType:"option",
          price:premium, consensus:delta>0.5||parseFloat(delta)>0.5?"Bullish Bias":"Neutral",
          counts:{"Strong Buy":0,"Buy":0,"Hold":1,"Sell":0,"Strong Sell":0}, ratingsCount:1, changeP:null,
        }} onClose={()=>setShowReport(false)}/>}
      </div>
    );
  }

  return (
    <div>
      {/* Search bar with validation feedback */}
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",gap:8,marginBottom:6}}>
          <div style={{flex:1,position:"relative"}}>
            <input value={inputTicker} onChange={e=>{setInputTicker(e.target.value.toUpperCase());setTickerStatus(null);}}
              onKeyDown={e=>e.key==="Enter"&&handleSearch()}
              placeholder="Enter ticker symbol (TSLA, AAPL, SPY, RY.TO…)"
              style={{width:"100%",boxSizing:"border-box",background:"#111827",
                border:`1px solid ${tickerStatus==="invalid"?"#ef4444":tickerStatus==="valid"?"#22c55e":"#1e293b"}`,
                color:"#e2e8f0",borderRadius:7,padding:"9px 36px 9px 12px",fontSize:13,outline:"none",fontFamily:"monospace"}}/>
            {tickerStatus==="checking"&&<span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:14,animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</span>}
            {tickerStatus==="valid"&&<span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"#22c55e",fontSize:16}}>✓</span>}
            {tickerStatus==="invalid"&&<span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"#ef4444",fontSize:16}}>✗</span>}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
          <button onClick={handleSearch}
            style={{background:"#3b82f6",border:"none",color:"#fff",borderRadius:7,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13,flexShrink:0}}>
            Load Chain
          </button>
        </div>
        {/* Quick ticker pills */}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["TSLA","AAPL","NVDA","SPY","QQQ","MSFT","AMZN","META","AMD","GOOGL","GME","PLTR"].map(t=>(
            <button key={t} onClick={()=>{setInputTicker(t);setTicker(t);setSelectedOpt(null);}}
              style={{background:ticker===t?"#1d4ed8":"#1e293b",border:`1px solid ${ticker===t?"#3b82f6":"#334155"}`,
              color:ticker===t?"#fff":"#94a3b8",borderRadius:5,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600}}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Status banners */}
      {loading&&<div style={{textAlign:"center",padding:30,color:"#64748b"}}>
        <div style={{fontSize:24,marginBottom:6,animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</div>
        <div>Validating and loading {ticker}…</div>
      </div>}

      {!loading&&error==="no_fmp_key"&&<div style={{background:"#1c1008",border:"1px solid #92400e",borderRadius:8,padding:12,color:"#fcd34d",fontSize:12,marginBottom:10}}>
        🔑 <strong>Add your FMP API key</strong> for real-time live options data.<br/>
        <span style={{color:"#78716c",marginTop:4,display:"block"}}>
          1. Go to <a href="https://site.financialmodelingprep.com" target="_blank" rel="noreferrer" style={{color:"#f59e0b"}}>financialmodelingprep.com</a> → Sign up free (250 calls/day)<br/>
          2. Copy your API key → tap 🔑 Keys button in the header → paste under FMP → Save<br/>
          3. Black-Scholes model data shown below until key is added
        </span>
      </div>}

      {!loading&&error==="fetching"&&<div style={{background:"#0c2040",border:"1px solid #1e40af",borderRadius:8,padding:"8px 12px",color:"#93c5fd",fontSize:11,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
        <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</span>
        <span>Fetching live options data from FMP…</span>
      </div>}

      {!loading&&error==="synthetic"&&<div style={{background:"#0c1a08",border:"1px solid #166534",borderRadius:8,padding:"8px 12px",color:"#86efac",fontSize:11,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
        <span>🔬</span>
        <span><strong>Black-Scholes model data</strong> — Add your FMP key for real-time live chain. Model Greeks, premiums and strikes are mathematically accurate.</span>
      </div>}

      {!loading&&chainData?.source&&!chainData.isSynthetic&&<div style={{background:"#052e16",border:"1px solid #16a34a",borderRadius:8,padding:"8px 12px",color:"#4ade80",fontSize:11,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
        <span>✅</span><span><strong>Live real-time data</strong> from {chainData.source} · Prices, Greeks and volume are live market data</span>
      </div>}

      {tickerStatus==="invalid"&&<div style={{background:"#450a0a",border:"1px solid #991b1b",borderRadius:8,padding:12,color:"#fca5a5",fontSize:12,marginBottom:12}}>
        ❌ {error}
      </div>}

      {!loading&&error&&!["synthetic","fetching","no_fmp_key"].includes(error)&&tickerStatus!=="invalid"&&
        <div style={{background:"#7f1d1d",borderRadius:8,padding:12,color:"#fca5a5",fontSize:12,marginBottom:12}}>{error}</div>}

      {chainData&&!loading&&tickerStatus!=="invalid"&&(
        <>
          {/* Underlying price */}
          <div style={{background:"#1e293b",borderRadius:8,padding:"10px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <span style={{fontFamily:"monospace",fontWeight:900,fontSize:16,color:"#f8fafc"}}>{ticker}</span>
              <span style={{fontSize:12,color:"#94a3b8",marginLeft:8}}>{tickerInfo?.name||underlying?.shortName||""}</span>
              {tickerInfo?.exchange&&<span style={{fontSize:10,color:"#64748b",marginLeft:6,background:"#0f172a",padding:"2px 6px",borderRadius:3}}>{tickerInfo.exchange}</span>}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:18,fontWeight:800,color:"#f1f5f9"}}>${spotPrice.toFixed(2)}</div>
              <PctBadge v={underlying?.regularMarketChangePercent?.toFixed(2)||0}/>
            </div>
          </div>

              {chainData.expirationDates?.length>0&&(
                <div style={{marginBottom:10,display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
                  <span style={{fontSize:10,color:"#64748b",flexShrink:0,alignSelf:"center"}}>Expiry:</span>
                  {chainData.expirationDates.slice(0,8).map(d=>{
                    const label=new Date(d*1000).toISOString().slice(0,10);
                    return <button key={d} onClick={()=>{
                      setSelectedExpiry(d);
                      // Regenerate chain for new expiry using time-adjusted IV
                      const cleanSym=ticker.toUpperCase().replace(".TO","");
                      const newChain=generateSyntheticChain(cleanSym, spotPrice||SEED_PRICES[cleanSym]||100);
                      // Update the options to use this expiry
                      newChain.options=[{
                        ...newChain.options[0],
                        expirationDate:d,
                        calls:newChain.options[0].calls.map(c=>({...c,expiration:d})),
                        puts:newChain.options[0].puts.map(p=>({...p,expiration:d})),
                      }];
                      newChain.expirationDates=chainData.expirationDates;
                      newChain.quote=chainData.quote;
                      setChainData(newChain);
                      setError("synthetic");
                    }}
                      style={{background:selectedExpiry===d?"#1d4ed8":"#1e293b",border:`1px solid ${selectedExpiry===d?"#3b82f6":"#334155"}`,
                      color:selectedExpiry===d?"#fff":"#94a3b8",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,flexShrink:0,whiteSpace:"nowrap"}}>
                      {label}
                    </button>;
                  })}
                </div>
              )}

          {/* Stats / Chain toggle */}
          <div style={{display:"flex",gap:0,marginBottom:10,background:"#111827",borderRadius:8,padding:3}}>
            {[["stats","📊 Statistics"],["chain","📋 Options Chain"]].map(([id,label])=>(
              <button key={id} onClick={()=>setView(id)} style={{flex:1,background:view===id?"#1e293b":"transparent",border:"none",color:view===id?"#e2e8f0":"#64748b",borderRadius:6,padding:"7px",cursor:"pointer",fontSize:12,fontWeight:700}}>{label}</button>
            ))}
          </div>

          {view==="stats"&&(
            <>
              {/* Volume stats */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                {[
                  {l:"Total Volume",v:fmt(totalVol),s:"all contracts today",c:"#3b82f6"},
                  {l:"Total Open Interest",v:fmt(totalOI),s:"active contracts",c:"#9333ea"},
                  {l:"Calls Volume",v:fmt(totalCallVol),s:`${((totalCallVol/totalVol||0)*100).toFixed(1)}% of total`,c:"#3b82f6"},
                  {l:"Puts Volume",v:fmt(totalPutVol),s:`${((totalPutVol/totalVol||0)*100).toFixed(1)}% of total`,c:"#9333ea"},
                ].map(m=>(
                  <div key={m.l} style={{background:"#1e293b",borderRadius:8,padding:"11px 13px"}}>
                    <div style={{fontSize:10,color:"#64748b"}}>{m.l}</div>
                    <div style={{fontSize:18,fontWeight:800,color:m.c}}>{m.v}</div>
                    <div style={{fontSize:10,color:"#475569"}}>{m.s}</div>
                  </div>
                ))}
              </div>

              {/* Volume donut */}
              <div style={{background:"#1e293b",borderRadius:8,padding:14,marginBottom:10}}>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Volume Distribution</div>
                <VolumeDonut callVol={totalCallVol} putVol={totalPutVol}/>
              </div>

              {/* Put/Call ratio */}
              <div style={{background:"#1e293b",borderRadius:8,padding:12}}>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Market Sentiment</div>
                {[
                  {l:"Put/Call Ratio (Vol)",v:(totalPutVol/(totalCallVol||1)).toFixed(2),note:totalPutVol>totalCallVol?"Bearish sentiment":"Bullish sentiment",c:totalPutVol>totalCallVol?"#ef4444":"#22c55e"},
                  {l:"Put/Call Ratio (OI)", v:(totalPutOI/(totalCallOI||1)).toFixed(2),note:"Based on open interest",c:"#94a3b8"},
                ].map(m=>(
                  <div key={m.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"#0f172a",borderRadius:7,marginBottom:5}}>
                    <div>
                      <div style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>{m.l}</div>
                      <div style={{fontSize:10,color:m.c}}>{m.note}</div>
                    </div>
                    <span style={{fontSize:18,fontWeight:800,color:m.c}}>{m.v}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {view==="chain"&&(
            <div>
              <div style={{fontSize:10,color:"#475569",marginBottom:8}}>Tap any row to see full analysis, payoff chart & Greeks</div>
              {/* Header */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 60px 1fr",gap:2,marginBottom:4}}>
                <div style={{fontSize:9,color:"#3b82f6",fontWeight:700,textAlign:"center",background:"#0f172a",borderRadius:"6px 0 0 6px",padding:"5px 4px"}}>CALLS</div>
                <div style={{fontSize:9,color:"#e2e8f0",fontWeight:700,textAlign:"center",background:"#1e293b",padding:"5px 2px"}}>STRIKE</div>
                <div style={{fontSize:9,color:"#9333ea",fontWeight:700,textAlign:"center",background:"#0f172a",borderRadius:"0 6px 6px 0",padding:"5px 4px"}}>PUTS</div>
              </div>
              {/* Match calls and puts by strike */}
              {[...new Set([...calls.map(c=>c.strike),...puts.map(p=>p.strike)])].sort((a,b)=>a-b).map(strike=>{
                const call=calls.find(c=>c.strike===strike);
                const put=puts.find(p=>p.strike===strike);
                const isATM=spotPrice&&Math.abs(strike-spotPrice)<spotPrice*0.02;
                return (
                  <div key={strike} style={{display:"grid",gridTemplateColumns:"1fr 60px 1fr",gap:2,marginBottom:2}}>
                    {/* Call side */}
                    <button onClick={()=>call&&setSelectedOpt({...call,contractType:"CALL"})}
                      style={{background:isATM?"#0c2040":"#0f172a",border:isATM?"1px solid #1e40af":"1px solid #1e293b",borderRadius:"6px 0 0 6px",padding:"6px 8px",cursor:call?"pointer":"default",textAlign:"left",color:"#e2e8f0"}}>
                      {call?<>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                          <span style={{color:"#60a5fa",fontWeight:700}}>${(call.lastPrice||call.ask||0).toFixed(2)}</span>
                          <span style={{color:"#64748b",fontSize:10}}>{call.volume>=1000?`${(call.volume/1000).toFixed(0)}K`:call.volume||"—"} vol</span>
                        </div>
                        <div style={{fontSize:9,color:"#475569"}}>IV {((call.impliedVolatility||0)*100).toFixed(0)}% · OI {call.openInterest>=1000?`${(call.openInterest/1000).toFixed(0)}K`:call.openInterest||"—"}</div>
                      </>:<span style={{fontSize:9,color:"#1e293b"}}>—</span>}
                    </button>
                    {/* Strike */}
                    <div style={{background:isATM?"#1e3a5f":"#1e293b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:isATM?"#60a5fa":"#94a3b8"}}>
                      ${strike}
                      {isATM&&<div style={{position:"absolute",fontSize:7,color:"#3b82f6",marginTop:18}}>ATM</div>}
                    </div>
                    {/* Put side */}
                    <button onClick={()=>put&&setSelectedOpt({...put,contractType:"PUT"})}
                      style={{background:isATM?"#200c30":"#0f172a",border:isATM?"1px solid #581c87":"1px solid #1e293b",borderRadius:"0 6px 6px 0",padding:"6px 8px",cursor:put?"pointer":"default",textAlign:"right",color:"#e2e8f0"}}>
                      {put?<>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                          <span style={{color:"#64748b",fontSize:10}}>{put.volume>=1000?`${(put.volume/1000).toFixed(0)}K`:put.volume||"—"} vol</span>
                          <span style={{color:"#c084fc",fontWeight:700}}>${(put.lastPrice||put.ask||0).toFixed(2)}</span>
                        </div>
                        <div style={{fontSize:9,color:"#475569",textAlign:"right"}}>OI {put.openInterest>=1000?`${(put.openInterest/1000).toFixed(0)}K`:put.openInterest||"—"} · IV {((put.impliedVolatility||0)*100).toFixed(0)}%</div>
                      </>:<span style={{fontSize:9,color:"#1e293b"}}>—</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── SCREENER OPTION CARD ─────────────────────────────────────────────────────
function ScreenerCard({opt,onClick,selected}) {
  const key=`${opt.underlying}-${opt.strike}-${opt.type}-${opt.expiry}`;
  const ratings=seedOptionsRatings(key);
  const consensus=calcConsensus(ratings);
  const isCall=opt.type==="CALL";
  const daysToExp=Math.max(0,Math.ceil((new Date(opt.expiry)-new Date())/(1000*60*60*24)));
  const contractCost=(opt.premium*100).toFixed(0);
  const riskColor=RISK_COLORS[opt.risk]||"#64748b";
  const mColor=MONEYNESS_COLORS[opt.moneyness]||"#64748b";
  const breakeven=isCall?(opt.strike+opt.premium).toFixed(2):(opt.strike-opt.premium).toFixed(2);
  const tier=opt.premium*100<50?"🟢":opt.premium*100<200?"🔵":opt.premium*100<500?"🟡":"🔴";
  return (
    <div onClick={onClick} style={{background:selected?"#1a2235":"#111827",border:`1.5px solid ${selected?(isCall?"#3b82f6":"#9333ea"):"#1f2937"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s",position:"relative"}}>
      {opt.beginner&&<div style={{position:"absolute",top:10,right:10,fontSize:9,background:"#064e3b",color:"#34d399",borderRadius:3,padding:"2px 6px",fontWeight:700}}>BEGINNER</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingRight:opt.beginner?75:0}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{fontFamily:"monospace",fontWeight:800,fontSize:14,color:"#e2e8f0"}}>{opt.underlying}</span>
            <Badge label={opt.type}/>
            <span style={{fontSize:11,fontFamily:"monospace",color:"#94a3b8",background:"#1e293b",padding:"2px 5px",borderRadius:3}}>${opt.strike}</span>
            <span style={{fontSize:10,color:mColor,background:`${mColor}18`,border:`1px solid ${mColor}44`,borderRadius:3,padding:"2px 5px",fontWeight:700}}>{opt.moneyness}</span>
          </div>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{opt.name} · {daysToExp}d left · {opt.sector}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,background:"#1e293b",borderRadius:8,padding:"8px 12px"}}>
        <div><div style={{fontSize:9,color:"#64748b"}}>Premium</div><div style={{fontSize:18,fontWeight:900,color:isCall?"#60a5fa":"#c084fc"}}>${opt.premium?.toFixed(2)}</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#64748b"}}>1 Contract</div><div style={{fontSize:17,fontWeight:800,color:"#f1f5f9"}}>{tier} ${contractCost}</div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"#64748b"}}>Breakeven</div><div style={{fontSize:13,fontWeight:700,color:"#f59e0b"}}>${breakeven}</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4,marginTop:7}}>
        {[{l:"IV",v:`${opt.iv}%`},{l:"Delta",v:opt.delta?.toFixed(2)},{l:"OI",v:opt.oi>=1000?`${(opt.oi/1000).toFixed(0)}k`:opt.oi},{l:"Risk",v:RISK_LABELS[opt.risk],c:riskColor}].map(m=>(
          <div key={m.l} style={{background:"#0f172a",borderRadius:5,padding:"4px 6px",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#64748b"}}>{m.l}</div>
            <div style={{fontSize:11,fontWeight:700,color:m.c||"#e2e8f0"}}>{m.v}</div>
          </div>
        ))}
      </div>
      <BreakdownBar ratings={ratings}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <div style={{fontSize:10,color:"#4b5563"}}>{ratings.length} desk ratings</div>
        <Badge label={consensus}/>
      </div>
    </div>
  );
}

// ─── SCREENER DETAIL ──────────────────────────────────────────────────────────
function ScreenerDetail({opt,onClose}) {
  const [showReport,setShowReport]=useState(false);
  const key=`${opt.underlying}-${opt.strike}-${opt.type}-${opt.expiry}`;
  const ratings=seedOptionsRatings(key);
  const consensus=calcConsensus(ratings);
  const counts={}; CONSENSUS_ORDER.forEach(r=>counts[r]=0); ratings.forEach(r=>{ if(counts[r.rating]!==undefined) counts[r.rating]++; });
  const isCall=opt.type==="CALL";
  const daysToExp=Math.max(0,Math.ceil((new Date(opt.expiry)-new Date())/(1000*60*60*24)));
  const contractCost=(opt.premium*100).toFixed(2);
  const breakeven=isCall?(opt.strike+opt.premium).toFixed(2):(opt.strike-opt.premium).toFixed(2);
  const pctBE=opt.spotPrice?Math.abs((parseFloat(breakeven)-opt.spotPrice)/opt.spotPrice*100).toFixed(1):null;
  const riskColor=RISK_COLORS[opt.risk]||"#64748b";
  return (
    <div style={{background:"#0f172a",border:`1.5px solid ${isCall?"#1e3a5f":"#2e1a5f"}`,borderRadius:12,padding:20,overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"monospace",fontWeight:900,fontSize:20,color:"#f8fafc"}}>{opt.underlying}</span>
            <Badge label={opt.type} size="lg"/><Badge label={consensus} size="lg"/>
            {opt.beginner&&<span style={{fontSize:10,background:"#064e3b",color:"#34d399",borderRadius:4,padding:"3px 8px",fontWeight:700}}>BEGINNER</span>}
          </div>
          <div style={{color:"#94a3b8",fontSize:12,marginTop:3}}>{opt.name} · {opt.sector} · Strike ${opt.strike} · {daysToExp} days</div>
        </div>
        <button onClick={onClose} style={{background:"#1e293b",border:"none",color:"#94a3b8",cursor:"pointer",borderRadius:6,padding:"6px 12px",fontSize:12}}>✕</button>
      </div>

      <button onClick={()=>setShowReport(true)} style={{width:"100%",marginBottom:14,padding:"11px 16px",background:"linear-gradient(135deg,#1d4ed8,#0c2040)",border:"1px solid #3b82f6",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span>📊</span> Generate Full Analyst Report with Conviction Evidence
      </button>

      <div style={{background:"linear-gradient(135deg,#0f2744,#1a1040)",border:"1px solid #1e40af",borderRadius:10,padding:14,marginBottom:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><div style={{fontSize:10,color:"#64748b"}}>Premium / share</div><div style={{fontSize:22,fontWeight:900,color:isCall?"#60a5fa":"#c084fc"}}>${opt.premium?.toFixed(2)}</div></div>
          <div><div style={{fontSize:10,color:"#64748b"}}>1 Contract (= max loss)</div><div style={{fontSize:22,fontWeight:900,color:"#f1f5f9"}}>${contractCost}</div></div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        {[
          {l:"Breakeven",v:`$${breakeven}`,s:pctBE?`${pctBE}% ${isCall?"above":"below"} current`:null,sc:"#f59e0b"},
          {l:"Max Loss",v:`-$${contractCost}`,s:"your full premium",sc:"#ef4444"},
          {l:"Max Profit",v:isCall?"Unlimited":`$${(opt.strike*100-parseFloat(contractCost)).toFixed(0)}`,s:isCall?"if stock rises above BE":null,sc:"#22c55e"},
          {l:"Days Left",v:daysToExp,s:daysToExp<7?"⚠️ Expiring soon!":daysToExp<30?"Few weeks":null,sc:daysToExp<7?"#ef4444":"#f59e0b"},
        ].map(m=>(
          <div key={m.l} style={{background:"#1e293b",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#64748b"}}>{m.l}</div>
            <div style={{fontSize:15,fontWeight:800,color:"#f1f5f9"}}>{m.v}</div>
            {m.s&&<div style={{fontSize:10,color:m.sc}}>{m.s}</div>}
          </div>
        ))}
      </div>

      {/* P&L Chart */}
      <div style={{marginBottom:10}}>
        <PayoffChart strike={opt.strike} premium={opt.premium} type={opt.type} spotPrice={opt.spotPrice||opt.strike}/>
      </div>

      {/* Greeks */}
      <div style={{background:"#1e293b",borderRadius:8,padding:"12px 14px",marginBottom:10}}>
        <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Greeks</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
          {[{l:"Delta",v:opt.delta?.toFixed(3),tip:"~$"+Math.abs(opt.delta||0).toFixed(2)+" per $1 move"},{l:"Theta",v:opt.theta?.toFixed(3),tip:`-$${Math.abs(opt.theta||0).toFixed(2)}/day decay`},{l:"Gamma",v:opt.gamma?.toFixed(3),tip:"Delta acceleration"},{l:"Vega",v:opt.vega?.toFixed(3),tip:"IV sensitivity"}].map(g=>(
            <div key={g.l} style={{background:"#0f172a",borderRadius:6,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontSize:9,color:"#64748b"}}>{g.l}</div>
              <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{g.v}</div>
              <div style={{fontSize:8,color:"#374151",marginTop:2}}>{g.tip}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:8,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:"#0f172a",borderRadius:6}}>
          <span style={{fontSize:10,color:"#64748b"}}>Risk Level</span>
          <span style={{fontSize:12,fontWeight:800,color:riskColor}}>{RISK_LABELS[opt.risk]||"—"}</span>
        </div>
      </div>

      {/* Profit scenarios */}
      <div style={{background:"#1e293b",borderRadius:8,padding:"12px 14px",marginBottom:10}}>
        <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Profit Scenarios (1 Contract)</div>
        {[{label:"Premium doubles (2×)",pct:100,gain:parseFloat(contractCost)},{label:"Premium triples (3×)",pct:200,gain:parseFloat(contractCost)*2},{label:"Expires worthless",pct:-100,gain:-parseFloat(contractCost)}].map(s=>(
          <div key={s.label} style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:"#0f172a",borderRadius:7,marginBottom:5}}>
            <span style={{fontSize:11,color:"#94a3b8"}}>{s.label}</span>
            <span style={{fontSize:13,fontWeight:700,color:s.gain>=0?"#22c55e":"#ef4444"}}>{s.gain>=0?"+":""} ${s.gain.toFixed(2)} ({s.pct>0?"+":""}{s.pct}%)</span>
          </div>
        ))}
      </div>

      {/* Analyst ratings */}
      <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Options Desk Ratings</div>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10}}>
        {ratings.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",background:"#1e293b",borderRadius:7,padding:"9px 12px",gap:8}}>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{r.firm}</div><div style={{fontSize:10,color:"#64748b"}}>{r.daysAgo}d ago</div></div>
            <div style={{fontSize:11,color:"#22c55e",fontWeight:600}}>tgt: ${r.targetPremium}</div>
            <Badge label={r.rating}/>
          </div>
        ))}
      </div>

      <div style={{background:"#0c1a2e",border:"1px solid #1e3a5f",borderRadius:8,padding:12,fontSize:10,color:"#64748b",lineHeight:1.8}}>
        <div style={{color:"#3b82f6",fontWeight:700,marginBottom:4}}>📚 Options Basics</div>
        <div><strong style={{color:"#94a3b8"}}>Call:</strong> Profit when stock goes UP above ${isCall?breakeven:"strike"}</div>
        <div><strong style={{color:"#94a3b8"}}>Put:</strong> Profit when stock goes DOWN below ${!isCall?breakeven:"strike"}</div>
        <div><strong style={{color:"#94a3b8"}}>Max Loss:</strong> Always limited to ${contractCost} (what you paid)</div>
        <div style={{marginTop:4,color:"#374151"}}>⚠️ Start with 1 contract. Options can expire worthless. Not financial advice.</div>
      </div>
      {showReport&&<AnalystReportModal subject={{
        ticker:`${opt.underlying} $${opt.strike} ${opt.type}`, name:opt.name, category:opt.sector, assetType:"option",
        price:opt.premium, consensus, counts, ratingsCount:ratings.length, changeP:null,
      }} onClose={()=>setShowReport(false)}/>}
    </div>
  );
}

// ─── STOCK / INDEX / FUTURES CARDS & DETAILS (condensed) ─────────────────────
function StockCard({stock,onClick,selected}) {
  const consensus=stock.consensus||"Hold";
  const upside=stock.avgTarget&&stock.price?(((stock.avgTarget-stock.price)/stock.price)*100).toFixed(1):null;
  return (
    <div onClick={onClick} style={{background:selected?"#1a2235":"#111827",border:`1.5px solid ${selected?"#3b82f6":"#1f2937"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{fontFamily:"monospace",fontWeight:800,fontSize:14,color:"#e2e8f0"}}>{stock.ticker}</span>
            <span style={{fontSize:10,color:"#6b7280",background:"#1f2937",borderRadius:3,padding:"2px 6px"}}>{stock.sector}</span>
            {stock.source&&!stock.loading&&<SourcePill source={stock.source}/>}
          </div>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{stock.name}</div>
        </div>
        <Badge label={consensus}/>
      </div>
      {stock.loading?<Skeleton/>:(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:10}}>
            <div>
              <span style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>{stock.price?`$${stock.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—"}</span>
              {stock.changeP!==undefined&&<span style={{marginLeft:6}}><PctBadge v={stock.changeP}/></span>}
            </div>
            {upside&&<div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#6b7280"}}>Avg Target</div><div style={{fontSize:12,fontWeight:700,color:parseFloat(upside)>=0?"#22c55e":"#ef4444"}}>${stock.avgTarget?.toFixed(2)} <span style={{fontSize:10}}>({upside>0?"+":""}{upside}%)</span></div></div>}
          </div>
          {stock.ratings&&<BreakdownBar ratings={stock.ratings}/>}
          <div style={{fontSize:10,color:"#4b5563",marginTop:4}}>{stock.ratings?`${stock.ratings.length} analyst ratings`:""}</div>
        </>
      )}
    </div>
  );
}

function IndexCard({idx,data,onClick,selected}) {
  const ratings=seedIndexRatings(idx.symbol);
  const bullish=ratings.filter(r=>r.outlook==="Bullish").length, bearish=ratings.filter(r=>r.outlook==="Bearish").length, neutral=ratings.filter(r=>r.outlook==="Neutral").length;
  const majority=bullish>bearish&&bullish>neutral?"Bullish":bearish>bullish&&bearish>neutral?"Bearish":"Neutral";
  return (
    <div onClick={onClick} style={{background:selected?"#1a2235":"#111827",border:`1.5px solid ${selected?"#3b82f6":"#1f2937"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>{idx.region}</span><span style={{fontFamily:"monospace",fontWeight:800,fontSize:13,color:"#e2e8f0"}}>{idx.symbol}</span></div><div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{idx.name}</div></div>
        <Badge label={majority}/>
      </div>
      {!data?<Skeleton/>:(<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:10}}>
          <div><span style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>{data.price?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span><span style={{marginLeft:6}}><PctBadge v={data.changeP}/></span></div>
        </div>
        <div style={{display:"flex",gap:3,borderRadius:4,overflow:"hidden",height:6,marginTop:8}}><div style={{flex:bullish,background:"#22c55e"}}/><div style={{flex:neutral,background:"#facc15"}}/><div style={{flex:bearish,background:"#ef4444"}}/></div>
        <div style={{fontSize:10,color:"#4b5563",marginTop:4}}>{ratings.length} outlooks · {bullish}↑ {neutral}→ {bearish}↓</div>
      </>)}
    </div>
  );
}

function FuturesCard({fut,data,onClick,selected}) {
  const ratings=seedFuturesRatings(fut.symbol); const consensus=calcConsensus(ratings); const catColor=CAT_COLOR[fut.category]||"#64748b";
  return (
    <div onClick={onClick} style={{background:selected?"#1a2235":"#111827",border:`1.5px solid ${selected?"#3b82f6":"#1f2937"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:"monospace",fontWeight:800,fontSize:13,color:"#e2e8f0"}}>{fut.symbol}</span><span style={{fontSize:10,background:`${catColor}22`,color:catColor,border:`1px solid ${catColor}44`,borderRadius:3,padding:"2px 6px"}}>{fut.category}</span></div><div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{fut.name} · {fut.unit}</div></div>
        <Badge label={consensus}/>
      </div>
      {!data?<Skeleton/>:(<><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:10}}><div><span style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>{data.price?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span><span style={{marginLeft:6}}><PctBadge v={data.changeP}/></span></div></div><BreakdownBar ratings={ratings}/><div style={{fontSize:10,color:"#4b5563",marginTop:4}}>{ratings.length} analyst ratings</div></>)}
    </div>
  );
}

// ─── AI ANALYST REPORT MODAL ─────────────────────────────────────────────────
function AnalystReportModal({subject, onClose}) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("Gathering analyst consensus...");
  const [grounded, setGrounded] = useState(false); // true if live web search findings were used

  useEffect(() => { generateReport(); }, []);

  // Phase 1 — search the web for current, real information about this ticker
  const researchCurrentInfo = async (ticker, name, assetType) => {
    const q = assetType==="option" ? ticker.split(" ")[0] : ticker; // search the underlying, not the contract string
    const prompt = `Search the web for the most recent analyst ratings, price target changes, earnings news, and market-moving headlines about ${q} (${name}). Return ONLY 4-6 short bullet points, each under 18 words, most recent/relevant first, no preamble, format:\n- fact one\n- fact two`;
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }]
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) return { bullets: null, grounded: false };
      const text = (data.content||[]).map(b=>b.type==="text"?b.text:"").filter(Boolean).join("\n").trim();
      const usedSearch = (data.content||[]).some(b=>b.type==="server_tool_use"||b.type==="web_search_tool_result");
      if (text && usedSearch) return { bullets: text, grounded: true };
      return { bullets: null, grounded: false };
    } catch(_) {
      return { bullets: null, grounded: false };
    }
  };

  const generateReport = async () => {
    setLoading(true); setError(null); setReport(null); setGrounded(false);
    const { ticker, name, category, assetType, price, consensus, counts, ratingsCount, avgTarget, changeP } = subject;
    const upside = avgTarget && price ? (((avgTarget - price) / price) * 100).toFixed(1) : null;
    const buyCount = (counts?.["Strong Buy"]||counts?.["Bullish"]||0) + (counts?.["Buy"]||0);
    const sellCount = (counts?.["Sell"]||counts?.["Bearish"]||0) + (counts?.["Strong Sell"]||0);

    const phases = ["Searching the web for current news...","Gathering analyst consensus...","Analysing conviction evidence...","Building bull & bear cases...","Writing report..."];
    let pi = 0;
    const phaseTimer = setInterval(() => { pi++; if(pi<phases.length) setPhase(phases[pi]); }, 1600);

    // ── Phase 1: live web research ──────────────────────────────────────
    const research = await researchCurrentInfo(ticker, name, assetType);
    setGrounded(research.grounded);

    const bearTarget = avgTarget ? Math.round(avgTarget*0.85) : (price?Math.round(price*0.82):null);
    const baseTarget = avgTarget ? Math.round(avgTarget) : (price?Math.round(price):null);
    const bullTarget = avgTarget ? Math.round(avgTarget*1.18) : (price?Math.round(price*1.28):null);
    const priceLine = assetType==="option" ? `Premium $${price?.toFixed(2)}` : `Price $${price?.toFixed(2)||"N/A"}`;
    const researchLine = research.bullets ? `\n\nRecent real findings from live web search (use these specific facts in your evidence):\n${research.bullets}` : "";

    const prompt = `You are a senior ${assetType==="option"?"options":assetType==="future"?"commodities":assetType==="index"?"macro":"equity"} research analyst. Write a CONCISE conviction-based report for ${ticker} (${name}), category: ${category}.

Data: ${priceLine}, Consensus: ${consensus}, Rating split: ${JSON.stringify(counts)}, Total ratings: ${ratingsCount}${avgTarget?`, Avg Target: $${avgTarget.toFixed(2)} (${upside}% from current)`:""}${changeP!==undefined&&changeP!==null?`, Today's change: ${changeP>=0?"+":""}${changeP}%`:""}.${researchLine}

Return ONLY valid minified JSON, no markdown, no backticks, no whitespace beyond what JSON needs. Be extremely concise — one short sentence per evidence field, total response under 550 words${research.bullets?". Ground bullCase/bearCase/keyCatalysts in the real findings above where relevant":""}:
{"executiveSummary":"2 sentences max, specific to ${ticker}","convictionScore":7,"convictionLabel":"short label e.g. High Conviction Buy","convictionReasoning":"1 sentence","bullCase":[{"title":"2-4 words","evidence":"1 short sentence"},{"title":"2-4 words","evidence":"1 short sentence"}],"bearCase":[{"title":"2-4 words","evidence":"1 short sentence"},{"title":"2-4 words","evidence":"1 short sentence"}],"keyCatalysts":[{"event":"short name","impact":"High","timeframe":"e.g. 2-4 weeks","description":"1 short sentence"},{"event":"short name","impact":"Medium","timeframe":"e.g. 1-3 months","description":"1 short sentence"}],"analystSentiment":"2 sentences on the ${buyCount} vs ${sellCount} split, specific to ${ticker}","keyMetrics":[{"metric":"name","value":"val","vs":"benchmark","signal":"bullish"},{"metric":"name","value":"val","vs":"benchmark","signal":"neutral"},{"metric":"name","value":"val","vs":"benchmark","signal":"bearish"}],"priceTargetBreakdown":{"bearTarget":${bearTarget||"null"},"baseTarget":${baseTarget||"null"},"bullTarget":${bullTarget||"null"},"reasoning":"1 sentence on what drives the range"},"recommendedAction":"1 sentence, specific and actionable"}`;

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_tokens: 1800, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || "server-error");
      }
      const raw = (data.content||[]).map(b=>b.type==="text"?b.text:"").filter(Boolean).join("\n");
      let clean = raw.replace(/```json|```/g,"").trim();
      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch(_) {
        // Truncated or malformed — try to salvage the largest valid JSON object substring
        const match = clean.match(/\{[\s\S]*\}/);

        if (match) {
          try { parsed = JSON.parse(match[0]); } catch(_2) { throw new Error("parse-failed"); }
        } else throw new Error("parse-failed");
      }
      setReport(parsed);
    } catch(e) {
      if (e.message && e.message.includes("ANTHROPIC_API_KEY")) {
        setError(e.message);
      } else if (e.message === "server-error" || e.message === "parse-failed") {
        setError("Report generation was interrupted or the response was malformed. This can happen occasionally — please try again.");
      } else {
        setError("Could not reach the report service. Please check your connection and try again.");
      }
    }
    clearInterval(phaseTimer);
    setLoading(false);
  };

  const IMPACT_COLOR = {High:"#ef4444", Medium:"#f59e0b", Low:"#22c55e"};
  const SIG_COLOR = {bullish:"#22c55e", bearish:"#ef4444", neutral:"#94a3b8"};
  const convScore = report?.convictionScore || 5;
  const convColor = convScore>=8?"#22c55e":convScore>=6?"#3b82f6":convScore>=4?"#f59e0b":"#ef4444";

  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:12,overflowY:"auto"}}>
      <div style={{background:"#0f172a",border:"1.5px solid #1e3a5f",borderRadius:12,width:"100%",maxWidth:680,marginTop:8,marginBottom:24}}>
        <div style={{padding:"16px 20px 12px",borderBottom:"1px solid #1e293b",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
              <span style={{fontFamily:"monospace",fontWeight:900,fontSize:20,color:"#f8fafc"}}>{subject.ticker}</span>
              <span style={{fontSize:10,background:"#1e293b",color:"#94a3b8",padding:"2px 7px",borderRadius:4}}>{subject.category}</span>
              <span style={{fontSize:10,background:"#0c2040",color:"#60a5fa",padding:"2px 7px",borderRadius:4,fontWeight:700}}>AI ANALYST REPORT</span>
              {!loading&&report&&(grounded
                ? <span style={{fontSize:10,background:"#052e16",color:"#4ade80",padding:"2px 7px",borderRadius:4,fontWeight:700}}>🔍 LIVE WEB SEARCH</span>
                : <span style={{fontSize:10,background:"#1c1008",color:"#fcd34d",padding:"2px 7px",borderRadius:4,fontWeight:700}}>🧠 MODEL REASONING</span>)}
            </div>
            <div style={{color:"#64748b",fontSize:11}}>{subject.name} · ${subject.price?.toFixed(2)} · {subject.consensus}</div>
          </div>
          <button onClick={onClose} style={{background:"#1e293b",border:"none",color:"#94a3b8",cursor:"pointer",borderRadius:6,padding:"6px 14px",fontSize:12,flexShrink:0}}>✕ Close</button>
        </div>

        {loading && <div style={{padding:48,textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12,display:"inline-block",animation:"spin 1.5s linear infinite"}}>📊</div>
          <div style={{color:"#60a5fa",fontSize:14,fontWeight:700,marginBottom:6}}>Generating Analyst Report</div>
          <div style={{color:"#475569",fontSize:12}}>{phase}</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>}

        {error&&!loading&&<div style={{padding:20,margin:16,background:"#450a0a",border:"1px solid #991b1b",borderRadius:8}}>
          <div style={{color:"#fca5a5",fontSize:12,marginBottom:12}}>{error}</div>
          <button onClick={generateReport} style={{background:"#991b1b",border:"none",color:"#fff",borderRadius:6,padding:"7px 16px",cursor:"pointer",fontSize:12,fontWeight:700}}>↻ Try Again</button>
        </div>}

        {report&&!loading&&<div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}}>

          <div style={{background:"#1e293b",borderRadius:10,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div><div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:0.5,marginBottom:3}}>Conviction Score</div>
                <div style={{fontSize:28,fontWeight:900,color:convColor}}>{convScore}<span style={{fontSize:13,color:"#64748b"}}>/10</span></div>
                <div style={{fontSize:12,fontWeight:700,color:convColor}}>{report.convictionLabel}</div></div>
              <div style={{maxWidth:260,textAlign:"right"}}><div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Why this score</div><div style={{fontSize:11,color:"#94a3b8",lineHeight:1.6}}>{report.convictionReasoning}</div></div>
            </div>
            <div style={{background:"#0f172a",borderRadius:5,height:8,overflow:"hidden"}}><div style={{height:"100%",width:`${convScore*10}%`,background:`linear-gradient(90deg,#3b82f6,${convColor})`,transition:"width 0.8s"}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}><span style={{fontSize:9,color:"#374151"}}>Strong Sell</span><span style={{fontSize:9,color:"#374151"}}>Strong Buy</span></div>
          </div>

          <div style={{background:"#0c1a2e",border:"1px solid #1e3a5f",borderRadius:10,padding:14}}>
            <div style={{fontSize:10,color:"#60a5fa",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>📋 Executive Summary</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.75}}>{report.executiveSummary}</div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{background:"#052e16",border:"1px solid #166534",borderRadius:10,padding:14}}>
              <div style={{fontSize:10,color:"#4ade80",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>🐂 Bull Case</div>
              {report.bullCase?.map((b,i)=><div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:i<report.bullCase.length-1?"1px solid #14532d":"none"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#86efac",marginBottom:3}}>{b.title}</div>
                <div style={{fontSize:11,color:"#4ade80",lineHeight:1.6,opacity:0.85}}>{b.evidence}</div>
              </div>)}
            </div>
            <div style={{background:"#450a0a",border:"1px solid #991b1b",borderRadius:10,padding:14}}>
              <div style={{fontSize:10,color:"#fca5a5",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>🐻 Bear Case</div>
              {report.bearCase?.map((b,i)=><div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:i<report.bearCase.length-1?"1px solid #7f1d1d":"none"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#fca5a5",marginBottom:3}}>{b.title}</div>
                <div style={{fontSize:11,color:"#fca5a5",lineHeight:1.6,opacity:0.85}}>{b.evidence}</div>
              </div>)}
            </div>
          </div>

          <div style={{background:"#1e293b",borderRadius:10,padding:14}}>
            <div style={{fontSize:10,color:"#f59e0b",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>⚡ Key Catalysts</div>
            {report.keyCatalysts?.map((c,i)=><div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{flexShrink:0,background:`${IMPACT_COLOR[c.impact]||"#64748b"}22`,border:`1px solid ${IMPACT_COLOR[c.impact]||"#64748b"}44`,color:IMPACT_COLOR[c.impact]||"#64748b",borderRadius:4,padding:"2px 6px",fontSize:9,fontWeight:700,marginTop:2}}>{c.impact}</span>
              <div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{c.event}</span><span style={{fontSize:10,color:"#64748b"}}>{c.timeframe}</span></div><div style={{fontSize:11,color:"#94a3b8",marginTop:2,lineHeight:1.5}}>{c.description}</div></div>
            </div>)}
          </div>

          <div style={{background:"#1e293b",borderRadius:10,padding:14}}>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>🎯 Analyst Sentiment</div>
            <div style={{fontSize:12,color:"#cbd5e1",lineHeight:1.7}}>{report.analystSentiment}</div>
          </div>

          {report.priceTargetBreakdown&&<div style={{background:"#1e293b",borderRadius:10,padding:14}}>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>📈 Price Target Scenarios</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
              {[{label:"Bear",val:report.priceTargetBreakdown.bearTarget,c:"#ef4444",bg:"#450a0a"},{label:"Base",val:report.priceTargetBreakdown.baseTarget,c:"#3b82f6",bg:"#0c2040"},{label:"Bull",val:report.priceTargetBreakdown.bullTarget,c:"#22c55e",bg:"#052e16"}].map(t=>{
                const up=subject.price?(((t.val-subject.price)/subject.price)*100).toFixed(0):0;
                return <div key={t.label} style={{background:t.bg,border:`1px solid ${t.c}44`,borderRadius:7,padding:"10px 12px",textAlign:"center"}}><div style={{fontSize:10,color:"#64748b",marginBottom:2}}>{t.label}</div><div style={{fontSize:18,fontWeight:900,color:t.c}}>${t.val}</div><div style={{fontSize:11,color:t.c,opacity:0.8}}>{up>0?"+":""}{up}%</div></div>;
              })}
            </div>
            <div style={{fontSize:11,color:"#64748b",lineHeight:1.6}}>{report.priceTargetBreakdown.reasoning}</div>
          </div>}

          {report.keyMetrics?.length>0&&<div style={{background:"#1e293b",borderRadius:10,padding:14}}>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>📊 Key Metrics</div>
            {report.keyMetrics.map((m,i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:i<report.keyMetrics.length-1?"1px solid #0f172a":"none"}}>
              <span style={{fontSize:12,color:"#94a3b8"}}>{m.metric}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,fontWeight:700,color:"#f1f5f9"}}>{m.value}</span>
                <span style={{fontSize:10,color:"#475569"}}>vs {m.vs}</span>
                <span style={{fontSize:10,fontWeight:700,color:SIG_COLOR[m.signal]||"#64748b",background:`${SIG_COLOR[m.signal]||"#64748b"}18`,padding:"2px 6px",borderRadius:3,textTransform:"uppercase"}}>{m.signal}</span>
              </div>
            </div>)}
          </div>}

          <div style={{background:"linear-gradient(135deg,#0c2040,#0c1a08)",border:"1px solid #1e40af",borderRadius:10,padding:14,display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:22,flexShrink:0}}>🎯</span>
            <div><div style={{fontSize:10,color:"#60a5fa",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Recommended Action</div>
            <div style={{fontSize:13,color:"#e2e8f0",fontWeight:600,lineHeight:1.6}}>{report.recommendedAction}</div></div>
          </div>

          <div style={{fontSize:10,color:"#374151",textAlign:"center",lineHeight:1.6}}>
            {grounded?"🔍 This report incorporated live web search results for current news and analyst activity.":"🧠 Live web search was unavailable for this report — based on model reasoning and the data shown above."}<br/>
            AI-generated for informational purposes only · Not financial advice · Always conduct your own research
          </div>
        </div>}
      </div>
    </div>
  );
}

function StockDetail({stock,onClose}) {
  const [showReport,setShowReport]=useState(false);
  const ratings=stock.ratings||[]; const consensus=stock.consensus||"Hold";
  const upside=stock.avgTarget&&stock.price?(((stock.avgTarget-stock.price)/stock.price)*100).toFixed(1):null;
  const counts={}; CONSENSUS_ORDER.forEach(r=>counts[r]=0); ratings.forEach(r=>counts[r.rating]++);
  return (
    <div style={{background:"#0f172a",border:"1.5px solid #1e3a5f",borderRadius:12,padding:20,overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={{fontFamily:"monospace",fontWeight:900,fontSize:20,color:"#f8fafc"}}>{stock.ticker}</span><Badge label={consensus} size="lg"/>{stock.source&&<SourcePill source={stock.source}/>}</div><div style={{color:"#94a3b8",fontSize:12,marginTop:3}}>{stock.name} · {stock.sector}</div></div>
        <button onClick={onClose} style={{background:"#1e293b",border:"none",color:"#94a3b8",cursor:"pointer",borderRadius:6,padding:"6px 12px",fontSize:12}}>✕</button>
      </div>
      <button onClick={()=>setShowReport(true)} style={{width:"100%",marginBottom:14,padding:"11px 16px",background:"linear-gradient(135deg,#1d4ed8,#0c2040)",border:"1px solid #3b82f6",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span>📊</span> Generate Full Analyst Report with Conviction Evidence
      </button>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        {[{l:"Price",v:stock.price?`$${stock.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—",s:stock.changeP!==undefined?`${stock.changeP>=0?"▲":"▼"} ${Math.abs(stock.changeP).toFixed(2)}%`:null,sc:stock.changeP>=0?"#22c55e":"#ef4444"},{l:"Avg Target",v:stock.avgTarget?`$${stock.avgTarget.toFixed(2)}`:"—",s:upside?`${parseFloat(upside)>=0?"+":""}${upside}% upside`:null,sc:parseFloat(upside||0)>=0?"#22c55e":"#ef4444"},{l:"Day Range",v:stock.low&&stock.high?`$${stock.low.toFixed(2)}–$${stock.high.toFixed(2)}`:"—"},{l:"Analysts",v:ratings.length||"—",s:"covering",sc:"#64748b"}].map(m=>(
          <div key={m.l} style={{background:"#1e293b",borderRadius:8,padding:"11px 13px"}}><div style={{fontSize:10,color:"#64748b",marginBottom:3}}>{m.l}</div><div style={{fontSize:16,fontWeight:800,color:"#f1f5f9"}}>{m.v}</div>{m.s&&<div style={{fontSize:11,color:m.sc||"#64748b",marginTop:2}}>{m.s}</div>}</div>
        ))}
      </div>
      {(stock.marketCap||stock.pe||stock.yearHigh||stock.volume)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:14}}>
        {[
          {l:"Market Cap",v:stock.marketCap?(stock.marketCap>=1e12?`$${(stock.marketCap/1e12).toFixed(2)}T`:stock.marketCap>=1e9?`$${(stock.marketCap/1e9).toFixed(2)}B`:`$${(stock.marketCap/1e6).toFixed(0)}M`):"—"},
          {l:"P/E",v:stock.pe?stock.pe.toFixed(1):"—"},
          {l:"52W Range",v:stock.yearLow&&stock.yearHigh?`$${stock.yearLow.toFixed(0)}–$${stock.yearHigh.toFixed(0)}`:"—"},
          {l:"Volume",v:stock.volume?(stock.volume>=1e6?`${(stock.volume/1e6).toFixed(1)}M`:`${(stock.volume/1e3).toFixed(0)}K`):"—"},
        ].map(m=>(
          <div key={m.l} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"7px 8px",textAlign:"center"}}><div style={{fontSize:9,color:"#64748b"}}>{m.l}</div><div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{m.v}</div></div>
        ))}
      </div>}
      {ratings.length>0&&<>
        <div style={{background:"#1e293b",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Distribution</div>
          {CONSENSUS_ORDER.map(r=>{const pct=ratings.length?Math.round((counts[r]/ratings.length)*100):0;return(<div key={r} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}><span style={{width:82,fontSize:11,color:"#94a3b8",flexShrink:0}}>{r}</span><div style={{flex:1,background:"#0f172a",borderRadius:3,height:7,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:BAR[r],transition:"width 0.5s"}}/></div><span style={{width:22,fontSize:11,color:"#64748b",textAlign:"right"}}>{counts[r]}</span></div>);})}
        </div>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Analyst Ratings</div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {[...ratings].sort((a,b)=>CONSENSUS_ORDER.indexOf(a.rating)-CONSENSUS_ORDER.indexOf(b.rating)).map((r,i)=>{const tgt=r.target??(stock.price?(stock.price*(r.targetMult||1)):null);const up=tgt&&stock.price?(((tgt-stock.price)/stock.price)*100).toFixed(1):null;return(<div key={i} style={{display:"flex",alignItems:"center",background:"#1e293b",borderRadius:7,padding:"9px 12px",gap:8}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.firm}</div><div style={{fontSize:10,color:"#64748b"}}>{r.daysAgo}d ago</div></div>{tgt&&<div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:11,color:parseFloat(up||0)>=0?"#22c55e":"#ef4444",fontWeight:600}}>${tgt.toFixed(2)}{up&&<span style={{fontSize:10}}> ({up>0?"+":""}{up}%)</span>}</div></div>}<Badge label={r.rating}/></div>);})}
        </div>
      </>}
      {showReport&&<AnalystReportModal subject={{
        ticker:stock.ticker, name:stock.name, category:stock.sector, assetType:"stock",
        price:stock.price, consensus, counts, ratingsCount:ratings.length,
        avgTarget:stock.avgTarget, changeP:stock.changeP,
      }} onClose={()=>setShowReport(false)}/>}
    </div>
  );
}

function IndexDetail({idx,data,onClose}) {
  const [showReport,setShowReport]=useState(false);
  const ratings=seedIndexRatings(idx.symbol);
  const bullish=ratings.filter(r=>r.outlook==="Bullish").length, bearish=ratings.filter(r=>r.outlook==="Bearish").length, neutral=ratings.filter(r=>r.outlook==="Neutral").length;
  const majority=bullish>bearish&&bullish>neutral?"Bullish":bearish>bullish&&bearish>neutral?"Bearish":"Neutral";
  return (
    <div style={{background:"#0f172a",border:"1.5px solid #1e3a5f",borderRadius:12,padding:20,overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{idx.region}</span><span style={{fontFamily:"monospace",fontWeight:900,fontSize:20,color:"#f8fafc"}}>{idx.symbol}</span></div><div style={{color:"#94a3b8",fontSize:12,marginTop:3}}>{idx.name}</div></div>
        <button onClick={onClose} style={{background:"#1e293b",border:"none",color:"#94a3b8",cursor:"pointer",borderRadius:6,padding:"6px 12px",fontSize:12}}>✕</button>
      </div>
      <button onClick={()=>setShowReport(true)} style={{width:"100%",marginBottom:14,padding:"11px 16px",background:"linear-gradient(135deg,#1d4ed8,#0c2040)",border:"1px solid #3b82f6",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span>📊</span> Generate Full Analyst Report with Conviction Evidence
      </button>
      {data&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>{[{l:"Level",v:data.price?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),s:`${data.changeP>=0?"▲":"▼"} ${Math.abs(data.changeP).toFixed(2)}%`,sc:data.changeP>=0?"#22c55e":"#ef4444"},{l:"Change",v:`${data.change>=0?"+":""}${data.change?.toFixed(2)}`,s:"today",sc:"#64748b"},{l:"High",v:data.high?.toFixed(2)||"—"},{l:"Low",v:data.low?.toFixed(2)||"—"}].map(m=>(<div key={m.l} style={{background:"#1e293b",borderRadius:8,padding:"11px 13px"}}><div style={{fontSize:10,color:"#64748b",marginBottom:3}}>{m.l}</div><div style={{fontSize:16,fontWeight:800,color:"#f1f5f9"}}>{m.v}</div>{m.s&&<div style={{fontSize:11,color:m.sc||"#64748b",marginTop:2}}>{m.s}</div>}</div>))}</div>}
      <div style={{background:"#1e293b",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Analyst Outlook</div>
        {[["Bullish","#22c55e",bullish],["Neutral","#facc15",neutral],["Bearish","#ef4444",bearish]].map(([l,c,n])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}><span style={{width:60,fontSize:11,color:"#94a3b8"}}>{l}</span><div style={{flex:1,background:"#0f172a",borderRadius:3,height:7,overflow:"hidden"}}><div style={{width:`${ratings.length?(n/ratings.length)*100:0}%`,height:"100%",background:c,transition:"width 0.5s"}}/></div><span style={{width:22,fontSize:11,color:"#64748b",textAlign:"right"}}>{n}</span></div>))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>{ratings.map((r,i)=>(<div key={i} style={{display:"flex",alignItems:"center",background:"#1e293b",borderRadius:7,padding:"9px 12px",gap:8}}><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{r.firm}</div><div style={{fontSize:10,color:"#64748b"}}>{r.daysAgo}d ago</div></div><div style={{fontSize:11,color:parseFloat(r.target)>=0?"#22c55e":"#ef4444",fontWeight:600}}>{parseFloat(r.target)>=0?"+":""}{r.target}% target</div><Badge label={r.outlook}/></div>))}</div>
      {showReport&&<AnalystReportModal subject={{
        ticker:idx.symbol, name:idx.name, category:"Index", assetType:"index",
        price:data?.price, consensus:majority, counts:{Bullish:bullish,Neutral:neutral,Bearish:bearish},
        ratingsCount:ratings.length, changeP:data?.changeP,
      }} onClose={()=>setShowReport(false)}/>}
    </div>
  );
}

function FuturesDetail({fut,data,onClose}) {
  const [showReport,setShowReport]=useState(false);
  const ratings=seedFuturesRatings(fut.symbol); const consensus=calcConsensus(ratings); const catColor=CAT_COLOR[fut.category]||"#64748b";
  const counts={}; CONSENSUS_ORDER.forEach(r=>counts[r]=0); ratings.forEach(r=>{ if(counts[r.rating]!==undefined) counts[r.rating]++; });
  return (
    <div style={{background:"#0f172a",border:"1.5px solid #1e3a5f",borderRadius:12,padding:20,overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:"monospace",fontWeight:900,fontSize:20,color:"#f8fafc"}}>{fut.symbol}</span><Badge label={consensus} size="lg"/></div><div style={{color:"#94a3b8",fontSize:12,marginTop:3}}>{fut.name} · <span style={{color:catColor}}>{fut.category}</span></div></div>
        <button onClick={onClose} style={{background:"#1e293b",border:"none",color:"#94a3b8",cursor:"pointer",borderRadius:6,padding:"6px 12px",fontSize:12}}>✕</button>
      </div>
      <button onClick={()=>setShowReport(true)} style={{width:"100%",marginBottom:14,padding:"11px 16px",background:"linear-gradient(135deg,#1d4ed8,#0c2040)",border:"1px solid #3b82f6",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span>📊</span> Generate Full Analyst Report with Conviction Evidence
      </button>
      {data&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>{[{l:"Price",v:`${data.price?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} ${fut.unit}`,s:`${data.changeP>=0?"▲":"▼"} ${Math.abs(data.changeP).toFixed(2)}%`,sc:data.changeP>=0?"#22c55e":"#ef4444"},{l:"Change",v:`${data.change>=0?"+":""}${data.change?.toFixed(2)}`,s:"session",sc:"#64748b"},{l:"High",v:data.high?.toFixed(2)||"—"},{l:"Low",v:data.low?.toFixed(2)||"—"}].map(m=>(<div key={m.l} style={{background:"#1e293b",borderRadius:8,padding:"11px 13px"}}><div style={{fontSize:10,color:"#64748b",marginBottom:3}}>{m.l}</div><div style={{fontSize:15,fontWeight:800,color:"#f1f5f9"}}>{m.v}</div>{m.s&&<div style={{fontSize:11,color:m.sc||"#64748b",marginTop:2}}>{m.s}</div>}</div>))}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:5}}>{ratings.map((r,i)=>(<div key={i} style={{display:"flex",alignItems:"center",background:"#1e293b",borderRadius:7,padding:"9px 12px",gap:8}}><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{r.firm}</div><div style={{fontSize:10,color:"#64748b"}}>{r.daysAgo}d ago</div></div><div style={{fontSize:11,color:parseFloat(r.target12m)>=0?"#22c55e":"#ef4444",fontWeight:600}}>{parseFloat(r.target12m)>=0?"+":""}{(parseFloat(r.target12m)*100).toFixed(0)}% 12m</div><Badge label={r.rating}/></div>))}</div>
      {showReport&&<AnalystReportModal subject={{
        ticker:fut.symbol, name:fut.name, category:fut.category, assetType:"future",
        price:data?.price, consensus, counts, ratingsCount:ratings.length, changeP:data?.changeP,
      }} onClose={()=>setShowReport(false)}/>}
    </div>
  );
}

function SettingsModal({keys,onSave,onClose}) {
  const [vals,setVals]=useState({...keys});
  return (
    <div style={{position:"fixed",inset:0,background:"#00000099",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0f172a",border:"1.5px solid #1e3a5f",borderRadius:12,padding:24,width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{fontSize:16,fontWeight:800,color:"#f8fafc",marginBottom:4}}>API Keys</div>
        <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>Keys stored in session only, sent directly to each provider.</div>
        <div style={{marginBottom:16,background:"#0c1a08",border:"1px solid #16a34a",borderRadius:8,padding:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
            <label style={{fontSize:12,fontWeight:700,color:"#4ade80"}}>⭐ FMP — Financial Modeling Prep <span style={{fontSize:10,color:"#16a34a",background:"#052e16",padding:"1px 6px",borderRadius:3,marginLeft:4}}>LIVE OPTIONS</span></label>
            <a href="https://site.financialmodelingprep.com" target="_blank" rel="noreferrer" style={{fontSize:10,color:"#3b82f6"}}>Get free key ↗</a>
          </div>
          <input value={vals.fmp||""} onChange={e=>setVals(v=>({...v,fmp:e.target.value}))} placeholder="Paste FMP API key (free — 250 calls/day)…"
            style={{width:"100%",boxSizing:"border-box",background:"#0f172a",border:"1px solid #166534",color:"#e2e8f0",borderRadius:7,padding:"8px 12px",fontSize:12,outline:"none",fontFamily:"monospace"}}/>
          <div style={{fontSize:10,color:"#4ade80",marginTop:4}}>✓ Real-time options chain · Greeks · Volume · OI · Ticker validation · 250 free calls/day</div>
        </div>
        {[{key:"finnhub",label:"Finnhub",url:"https://finnhub.io",hint:"Analyst ratings + price targets"},{key:"alphavantage",label:"Alpha Vantage",url:"https://www.alphavantage.co/support/#api-key",hint:"Global stock quotes incl. TSX"},{key:"polygon",label:"Polygon.io",url:"https://polygon.io",hint:"US stock delayed quotes"}].map(p=>(
          <div key={p.key} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><label style={{fontSize:12,fontWeight:600,color:"#94a3b8"}}>{p.label}</label><a href={p.url} target="_blank" rel="noreferrer" style={{fontSize:10,color:"#3b82f6"}}>Get free key ↗</a></div>
            <input value={vals[p.key]||""} onChange={e=>setVals(v=>({...v,[p.key]:e.target.value}))} placeholder={`${p.label} API key…`} style={{width:"100%",boxSizing:"border-box",background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",borderRadius:7,padding:"8px 12px",fontSize:12,outline:"none",fontFamily:"monospace"}}/>
            <div style={{fontSize:10,color:"#475569",marginTop:2}}>{p.hint}</div>
          </div>
        ))}
        <div style={{fontSize:11,color:"#475569",marginBottom:14,padding:"8px 12px",background:"#1e293b",borderRadius:6}}>💡 Yahoo Finance is always active — no key needed for stock quotes.</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:7,padding:"8px 18px",cursor:"pointer",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(vals)} style={{background:"#3b82f6",border:"none",color:"#fff",borderRadius:7,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>Save & Refresh</button>
        </div>
      </div>
    </div>
  );
}
// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("stocks");
  const [subTab,setSubTab]=useState("SP500");
  const [optMode,setOptMode]=useState("screener"); // screener | chain
  const [optFilter,setOptFilter]=useState("ALL");
  const [budgetFilter,setBudgetFilter]=useState("all");
  const [beginnerOnly,setBeginnerOnly]=useState(false);
  const [futFilter,setFutFilter]=useState("All");
  const [stockData,setStockData]=useState({});
  const [indexData,setIndexData]=useState({});
  const [futuresData,setFuturesData]=useState({});
  const [selected,setSelected]=useState(null);
  const [search,setSearch]=useState("");
  const [showSettings,setShowSettings]=useState(false);
  const [apiKeys,setApiKeys]=useState(()=>{ try{ return JSON.parse(sessionStorage.getItem("av_keys")||"{}"); }catch{ return{}; } });
  const [time,setTime]=useState(new Date());
  const [lastRefresh,setLastRefresh]=useState(null);
  const loadingRef=useRef({});

  useEffect(()=>{
    if(apiKeys.finnhub)      API_KEYS.finnhub=apiKeys.finnhub;
    if(apiKeys.alphavantage) API_KEYS.alphavantage=apiKeys.alphavantage;
    if(apiKeys.polygon)      API_KEYS.polygon=apiKeys.polygon;
    if(apiKeys.fmp)          API_KEYS.fmp=apiKeys.fmp;
  },[apiKeys]);
  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),15000); return()=>clearInterval(t); },[]);

  const loadStock=useCallback(async(stock)=>{
    const key=stock.ticker; if(loadingRef.current[key]) return; loadingRef.current[key]=true;
    setStockData(p=>({...p,[key]:{...stock,loading:true}}));
    const quote=await fetchQuote(stock.ticker);
    const price=quote?.price??SEED_PRICES[stock.ticker]??100;
    const [rec,target]=await Promise.all([fetchFinnhubRec(stock.ticker).catch(()=>null),fetchFinnhubTarget(stock.ticker).catch(()=>null)]);
    let ratings,consensus,avgTarget;
    if(rec&&((rec.strongBuy||0)+(rec.buy||0)+(rec.hold||0)+(rec.sell||0)+(rec.strongSell||0))>0){
      consensus=consensusFromFinnhub(rec);
      ratings=[...Array(rec.strongBuy||0).fill(0).map((_,i)=>({firm:ANALYST_FIRMS[i%ANALYST_FIRMS.length],rating:"Strong Buy",daysAgo:i*3+1,target})),...Array(rec.buy||0).fill(0).map((_,i)=>({firm:ANALYST_FIRMS[(i+3)%ANALYST_FIRMS.length],rating:"Buy",daysAgo:i*4+2,target})),...Array(rec.hold||0).fill(0).map((_,i)=>({firm:ANALYST_FIRMS[(i+6)%ANALYST_FIRMS.length],rating:"Hold",daysAgo:i*5+3,target})),...Array(rec.sell||0).fill(0).map((_,i)=>({firm:ANALYST_FIRMS[(i+9)%ANALYST_FIRMS.length],rating:"Sell",daysAgo:i*6+4,target})),...Array(rec.strongSell||0).fill(0).map((_,i)=>({firm:ANALYST_FIRMS[(i+12)%ANALYST_FIRMS.length],rating:"Strong Sell",daysAgo:i*7+5,target}))];
      avgTarget=target??price;
    } else { ratings=seedRatings(stock.ticker,target); consensus=calcConsensus(ratings); avgTarget=target??(price*(0.90+Math.random()*0.28)); }
    setStockData(p=>({...p,[key]:{...stock,loading:false,price,change:quote?.change??0,changeP:quote?.changeP??0,high:quote?.high,low:quote?.low,volume:quote?.volume,marketCap:quote?.marketCap,pe:quote?.pe,eps:quote?.eps,yearHigh:quote?.yearHigh,yearLow:quote?.yearLow,avgVolume:quote?.avgVolume,source:quote?.source??"Seed Data",ratings,consensus,avgTarget:+avgTarget.toFixed(2)}}));
    loadingRef.current[key]=false;
  },[]);

  const loadIndex=useCallback(async(idx)=>{ const key=idx.symbol; if(loadingRef.current["i_"+key]) return; loadingRef.current["i_"+key]=true; const quote=await fetchYahoo(idx.ySymbol).catch(()=>null); setIndexData(p=>({...p,[key]:quote??SEED_INDEX[key]??{price:0,change:0,changeP:0}})); loadingRef.current["i_"+key]=false; },[]);
  const loadFuture=useCallback(async(fut)=>{ const key=fut.symbol; if(loadingRef.current["f_"+key]) return; loadingRef.current["f_"+key]=true; const quote=await fetchYahoo(fut.symbol).catch(()=>null); setFuturesData(p=>({...p,[key]:quote??SEED_FUTURES[key]??{price:0,change:0,changeP:0}})); loadingRef.current["f_"+key]=false; },[]);

  // ── Live screener repricing — fetch current spot prices, recompute premium/Greeks ──
  const [screenerSpots,setScreenerSpots]=useState({});
  const [screenerLive,setScreenerLive]=useState(false);
  const [screenerUpdated,setScreenerUpdated]=useState(null);
  const loadScreenerPrices=useCallback(async()=>{
    const tickers=[...new Set(OPTIONS_SCREENER.map(o=>o.underlying))];
    if(API_KEYS.fmp){
      try{
        const res=await fetch(`https://financialmodelingprep.com/api/v3/quote/${tickers.join(",")}?apikey=${API_KEYS.fmp}`,{signal:AbortSignal.timeout(6000)});
        if(res.ok){
          const data=await res.json();
          if(Array.isArray(data)&&data.length){
            const map={}; data.forEach(q=>{ if(q.symbol&&q.price) map[q.symbol]=q.price; });
            setScreenerSpots(map); setScreenerLive(true); setScreenerUpdated(new Date());
            return;
          }
        }
      }catch(_){}
    }
    // Fallback: Yahoo per-ticker (small concurrency-limited batch)
    const map={};
    await Promise.all(tickers.map(async t=>{
      const q=await fetchYahoo(t).catch(()=>null);
      map[t]=q?.price??SEED_PRICES[t]??null;
    }));
    setScreenerSpots(map); setScreenerLive(false); setScreenerUpdated(new Date());
  },[]);
  useEffect(()=>{ loadScreenerPrices(); const t=setInterval(loadScreenerPrices,120000); return()=>clearInterval(t); },[loadScreenerPrices]);

  const liveScreenerOptions=useMemo(()=>{
    const expiries=getUpcomingExpiries(); // always-future dates, recalculated fresh
    return OPTIONS_SCREENER.map((o,i)=>{
      // Deterministically assign an active expiry — same contract always gets the same
      // slot within a session, but it's always a real upcoming Friday, never stale.
      const seed=(o.underlying+o.strike+o.type).split("").reduce((a,c)=>a+c.charCodeAt(0),0);
      const activeExpiry=expiries[(seed+i)%expiries.length];
      const spot=screenerSpots[o.underlying];
      const daysToExp=Math.max(1,Math.ceil((new Date(activeExpiry)-new Date())/(1000*60*60*24)));
      if(!spot) return {...o, expiry:activeExpiry}; // no live price yet — keep seed premium, but fix expiry
      const T=daysToExp/365;
      const bs=blackScholesPrice(spot,o.strike,T,o.iv/100,o.type==="CALL");
      if(!bs) return {...o, expiry:activeExpiry, spotPrice:spot};
      return {
        ...o, expiry:activeExpiry, spotPrice:spot,
        premium:+bs.price.toFixed(2),
        delta:+bs.delta.toFixed(4), gamma:+bs.gamma.toFixed(4),
        theta:+bs.theta.toFixed(4), vega:+bs.vega.toFixed(4),
        moneyness: o.type==="CALL" ? (spot>o.strike*1.02?"ITM":spot<o.strike*0.98?"OTM":"ATM")
                                    : (spot<o.strike*0.98?"ITM":spot>o.strike*1.02?"OTM":"ATM"),
        isLivePriced: true,
      };
    });
  },[screenerSpots]);

  useEffect(()=>{ loadingRef.current={}; STOCKS[subTab]?.forEach(s=>loadStock(s)); INDICES.forEach(i=>loadIndex(i)); FUTURES.forEach(f=>loadFuture(f)); setLastRefresh(new Date()); },[subTab,loadStock,loadIndex,loadFuture]);
  useEffect(()=>{ const t=setInterval(()=>{ loadingRef.current={}; STOCKS[subTab]?.forEach(s=>loadStock(s)); INDICES.forEach(i=>loadIndex(i)); FUTURES.forEach(f=>loadFuture(f)); setLastRefresh(new Date()); },60000); return()=>clearInterval(t); },[subTab,loadStock,loadIndex,loadFuture]);

  const handleSaveKeys=(vals)=>{ sessionStorage.setItem("av_keys",JSON.stringify(vals)); setApiKeys(vals); setShowSettings(false); loadingRef.current={}; STOCKS[subTab]?.forEach(s=>loadStock(s)); setTimeout(loadScreenerPrices,200); };

  const mktOpen=time.getHours()>=9&&time.getHours()<16;
  const keysConfigured=[apiKeys.fmp,apiKeys.finnhub,apiKeys.alphavantage,apiKeys.polygon].filter(k=>k&&k.length>10).length;
  const currentStocks=STOCKS[subTab]?.map(s=>stockData[s.ticker]||{...s,loading:true})||[];
  const filteredStocks=currentStocks.filter(s=>{ const q=search.toLowerCase(); return !q||s.ticker.toLowerCase().includes(q)||s.name.toLowerCase().includes(q)||s.sector.toLowerCase().includes(q); });
  const activeTier=BUDGET_TIERS.find(t=>t.id===budgetFilter)||BUDGET_TIERS[0];
  const filteredScreener=liveScreenerOptions.filter(o=>{ const daysLeft=Math.ceil((new Date(o.expiry)-new Date())/(1000*60*60*24)); if(daysLeft<=0) return false; const q=search.toLowerCase(); const matchSearch=!q||o.underlying.toLowerCase().includes(q)||o.name.toLowerCase().includes(q)||o.sector?.toLowerCase().includes(q); const matchType=optFilter==="ALL"||o.type===optFilter; const cc=o.premium*100; const matchBudget=budgetFilter==="all"||(activeTier.specOnly?o.risk>=4:(cc<activeTier.max&&o.risk<4)); return matchSearch&&matchType&&matchBudget&&(!beginnerOnly||o.beginner); }).sort((a,b)=>a.premium*100-b.premium*100);
  const futCategories=["All",...new Set(FUTURES.map(f=>f.category))];
  const filteredFutures=FUTURES.filter(f=>{ const q=search.toLowerCase(); return(!q||f.name.toLowerCase().includes(q)||f.symbol.toLowerCase().includes(q))&&(futFilter==="All"||f.category===futFilter); });
  const filteredIndices=INDICES.filter(i=>{ const q=search.toLowerCase(); return !q||i.symbol.toLowerCase().includes(q)||i.name.toLowerCase().includes(q); });
  const TABS=[{id:"stocks",label:"📈 Stocks"},{id:"options",label:"⚡ Options"},{id:"indices",label:"🌐 Indices"},{id:"futures",label:"🛢 Futures"}];

  return (
    <div style={{minHeight:"100vh",background:"#060e1a",color:"#e2e8f0",fontFamily:"'Inter',-apple-system,sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* Header */}
      <div style={{background:"#080f1c",borderBottom:"1px solid #1e293b",padding:"0 16px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:50}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:26,height:26,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff"}}>A</div>
            <span style={{fontWeight:800,fontSize:15,color:"#f8fafc"}}>AnalystView</span>
            <span style={{fontSize:10,color:"#475569",background:"#1e293b",padding:"2px 7px",borderRadius:10}}>PRO</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:mktOpen?"#22c55e":"#ef4444",boxShadow:mktOpen?"0 0 5px #22c55e":"none"}}/><span style={{fontSize:11,color:"#64748b"}}>{mktOpen?"Open":"Closed"}</span></div>
            <button onClick={()=>setShowSettings(true)} style={{background:"#1e293b",border:`1px solid ${keysConfigured>0?"#22c55e44":"#ca8a0444"}`,color:keysConfigured>0?"#22c55e":"#f59e0b",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>🔑 {keysConfigured}/3</button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{background:"#080f1c",borderBottom:"1px solid #1e293b",padding:"0 16px",display:"flex",alignItems:"center",flexShrink:0,overflowX:"auto"}}>
        {TABS.map(t=>(<button key={t.id} onClick={()=>{setTab(t.id);setSelected(null);setSearch("");}} style={{background:"none",border:"none",cursor:"pointer",padding:"11px 14px",fontSize:12,fontWeight:700,whiteSpace:"nowrap",color:tab===t.id?"#3b82f6":"#64748b",borderBottom:tab===t.id?"2px solid #3b82f6":"2px solid transparent"}}>{t.label}</button>))}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          {lastRefresh&&<span style={{fontSize:10,color:"#374151"}}>{lastRefresh.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>}
          <button onClick={()=>{loadingRef.current={};STOCKS[subTab]?.forEach(s=>loadStock(s));INDICES.forEach(i=>loadIndex(i));FUTURES.forEach(f=>loadFuture(f));setLastRefresh(new Date());}} style={{background:"#1e293b",border:"1px solid #1f2937",color:"#64748b",borderRadius:5,padding:"4px 10px",cursor:"pointer",fontSize:11}}>↻</button>
        </div>
      </div>

      {/* Sub-tabs per section */}
      {tab==="stocks"&&(<div style={{background:"#080f1c",borderBottom:"1px solid #111827",padding:"0 16px",display:"flex",flexShrink:0}}>{[["SP500","🇺🇸 S&P 500"],["TSX","🇨🇦 TSX"]].map(([id,label])=>(<button key={id} onClick={()=>{setSubTab(id);setSelected(null);}} style={{background:"none",border:"none",cursor:"pointer",padding:"9px 14px",fontSize:11,fontWeight:700,color:subTab===id?"#60a5fa":"#64748b",borderBottom:subTab===id?"2px solid #60a5fa":"2px solid transparent"}}>{label}</button>))}</div>)}

      {tab==="options"&&(
        <>
          <div style={{background:"#080f1c",borderBottom:"1px solid #111827",padding:"0 16px",display:"flex",alignItems:"center",flexShrink:0}}>
            {[["screener","🔍 Screener"],["chain","📊 Live Chain"]].map(([id,label])=>(<button key={id} onClick={()=>{setOptMode(id);setSelected(null);}} style={{background:"none",border:"none",cursor:"pointer",padding:"9px 14px",fontSize:11,fontWeight:700,color:optMode===id?"#60a5fa":"#64748b",borderBottom:optMode===id?"2px solid #60a5fa":"2px solid transparent"}}>{label}</button>))}
            {optMode==="screener"&&(<>
              {[["ALL","All"],["CALL","Calls"],["PUT","Puts"]].map(([id,label])=>(<button key={id} onClick={()=>{setOptFilter(id);setSelected(null);}} style={{background:"none",border:"none",cursor:"pointer",padding:"9px 10px",fontSize:11,fontWeight:700,color:optFilter===id?(id==="CALL"?"#60a5fa":id==="PUT"?"#c084fc":"#60a5fa"):"#64748b",borderBottom:optFilter===id?`2px solid ${id==="CALL"?"#3b82f6":id==="PUT"?"#9333ea":"#60a5fa"}`:"2px solid transparent"}}>{label}</button>))}
              <div style={{marginLeft:"auto"}}><button onClick={()=>setBeginnerOnly(b=>!b)} style={{background:beginnerOnly?"#064e3b":"#1e293b",border:`1px solid ${beginnerOnly?"#34d399":"#334155"}`,color:beginnerOnly?"#34d399":"#64748b",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:10,fontWeight:700}}>🌱 Beginner</button></div>
            </>)}
          </div>
          {optMode==="screener"&&(
            <div style={{background:"#060e1a",borderBottom:"1px solid #111827",padding:"7px 16px",display:"flex",gap:6,flexShrink:0,overflowX:"auto",alignItems:"center"}}>
              <span style={{fontSize:10,color:"#475569",flexShrink:0}}>Budget:</span>
              {BUDGET_TIERS.map(tier=>(<button key={tier.id} onClick={()=>setBudgetFilter(tier.id)} style={{background:budgetFilter===tier.id?`${tier.color}22`:"#111827",border:`1px solid ${budgetFilter===tier.id?tier.color:"#1f2937"}`,color:budgetFilter===tier.id?tier.color:"#64748b",borderRadius:20,padding:"4px 12px",cursor:"pointer",fontSize:11,fontWeight:700,flexShrink:0}}>{tier.label}</button>))}
              <span style={{fontSize:10,color:screenerLive?"#4ade80":"#94a3b8",marginLeft:"auto",flexShrink:0,display:"flex",alignItems:"center",gap:4}}>
                <span>{screenerLive?"🟢":"🔬"}</span>
                <span>{filteredScreener.length} · cheapest first · {screenerLive?"live prices":"model prices"}{screenerUpdated?` · ${screenerUpdated.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`:""}</span>
              </span>
            </div>
          )}
        </>
      )}

      {tab==="futures"&&(<div style={{background:"#080f1c",borderBottom:"1px solid #111827",padding:"0 16px",display:"flex",flexShrink:0,overflowX:"auto"}}>{futCategories.map(cat=>(<button key={cat} onClick={()=>{setFutFilter(cat);setSelected(null);}} style={{background:"none",border:"none",cursor:"pointer",padding:"9px 12px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",color:futFilter===cat?(CAT_COLOR[cat]||"#60a5fa"):"#64748b",borderBottom:futFilter===cat?`2px solid ${CAT_COLOR[cat]||"#3b82f6"}`:"2px solid transparent"}}>{cat}</button>))}</div>)}

      {/* Search */}
      {!(tab==="options"&&optMode==="chain")&&(
        <div style={{padding:"10px 16px",background:"#080f1c",borderBottom:"1px solid #111827",flexShrink:0}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${tab}…`} style={{width:"100%",boxSizing:"border-box",background:"#111827",border:"1px solid #1e293b",color:"#e2e8f0",borderRadius:7,padding:"8px 12px",fontSize:13,outline:"none"}}/>
        </div>
      )}

      {/* Main content */}
      <div style={{flex:1,display:"grid",gridTemplateColumns:selected?"1fr 360px":"1fr",overflow:"hidden"}}>
        <div style={{overflowY:"auto",padding:14}}>

          {tab==="options"&&optMode==="chain"&&<LiveChainView/>}

          {tab==="options"&&optMode==="screener"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
              {filteredScreener.map((opt,i)=>{
                const key=`${opt.underlying}-${opt.strike}-${opt.type}-${opt.expiry}`;
                return <ScreenerCard key={key} opt={opt} onClick={()=>setSelected(selected?._key===key?null:{type:"option",_key:key,...opt})} selected={selected?._key===key}/>;
              })}
              {filteredScreener.length===0&&<div style={{textAlign:"center",color:"#475569",padding:60,fontSize:14,gridColumn:"1/-1"}}>No options match your filters.</div>}
            </div>
          )}

          {tab==="stocks"&&(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>{filteredStocks.map(stock=>(<StockCard key={stock.ticker} stock={stock} onClick={()=>setSelected(selected?.ticker===stock.ticker?null:{type:"stock",...stock})} selected={selected?.ticker===stock.ticker}/>))}</div>)}

          {tab==="indices"&&(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>{filteredIndices.map(idx=>(<IndexCard key={idx.symbol} idx={idx} data={indexData[idx.symbol]} onClick={()=>setSelected(selected?.symbol===idx.symbol?null:{type:"index",...idx})} selected={selected?.symbol===idx.symbol}/>))}</div>)}

          {tab==="futures"&&(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>{filteredFutures.map(fut=>(<FuturesCard key={fut.symbol} fut={fut} data={futuresData[fut.symbol]} onClick={()=>setSelected(selected?.symbol===fut.symbol?null:{type:"future",...fut})} selected={selected?.symbol===fut.symbol}/>))}</div>)}

        </div>

        {/* Detail panel */}
        {selected&&!(tab==="options"&&optMode==="chain")&&(
          <div style={{borderLeft:"1px solid #1e293b",overflowY:"auto",padding:12}}>
            {selected.type==="stock"&&<StockDetail stock={stockData[selected.ticker]||selected} onClose={()=>setSelected(null)}/>}
            {selected.type==="option"&&<ScreenerDetail opt={selected} onClose={()=>setSelected(null)}/>}
            {selected.type==="index"&&<IndexDetail idx={selected} data={indexData[selected.symbol]} onClose={()=>setSelected(null)}/>}
            {selected.type==="future"&&<FuturesDetail fut={selected} data={futuresData[selected.symbol]} onClose={()=>setSelected(null)}/>}
          </div>
        )}
      </div>

      <div style={{borderTop:"1px solid #1e293b",padding:"7px 16px",display:"flex",justifyContent:"space-between",background:"#080f1c",flexShrink:0}}>
        <span style={{fontSize:10,color:"#374151"}}>AnalystView · Not financial advice · Live options via Yahoo Finance</span>
        <span style={{fontSize:10,color:"#374151",fontFamily:"monospace"}}>{time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
      </div>

      {showSettings&&<SettingsModal keys={apiKeys} onSave={handleSaveKeys} onClose={()=>setShowSettings(false)}/>}
    </div>
  );
}
