function load_recipe_A()
{
	// Recipe loading initialization bit
	WriteData("DB1262.DBX34.2",0); //Recipe loading message
	
	// System variables definiton
	var  data, dat, datLen, line, i, cont_angle_max, cont_temp_max, cont_angle_min, cont_temp_min;
	
	// Initialization of the index counters for UGUD and PLC variables
	
	var cont= 0;
	var journIndex = 2;
	var ord = 2;
	var ords = 2;
	var j_cont = 0;
	var laps = 0;
	var offstH = 5;
	var offstT = 6;
	var angleH = 5;
	var angleT = 6;
	var ovrlpH = 5;
	var ovrlpT = 6;
	var feedH = 5;
	var feedT = 6;
	var pid = 154;
	var t_journ = 30;
	var t_laps = 28;
	var angle_upper = 60;
	var temp_upper = 140;
	var angle_lower = 3320;
	var temp_lower = 3400;
	var part_name_csv = "";
	
	var part_n = ReadData("DB1260.DBB192");  // Read actual part type number to set the temperature DB counter
	var PartNameAux="";
	PartNameAux=ReadData("DB60.DBB"+(2+16*(part_n-1))+"[16]:ascii"); 
	var PartName = "";
	var NameEnd=false; 
	for(i=0;i<PartNameAux.length;i++)
	{	
		if (i<PartNameAux.length-2)
		{
			if ((PartNameAux[i]==' ')&&(PartNameAux[i+1]==' '))
			{
				NameEnd=true;
			}
		}
		else if (PartNameAux[i]==' ')
		{
			NameEnd=true;
		}
		if (NameEnd==false)
		{
				PartName=PartName+PartNameAux[i];      //Remove empty characters from part type name
		}
	}
	WriteData("/nc/_n_ch_gd3_acx/PART_TYPE_NAME[u1]","");  //Initialize part type name in UGUD

	// Unit A Recipe loading PLC sequence
	if ((ReadData("DB1262.DBX35.0")) == 1) //Auto or Manual Recipe Loading?
	{
		var recipePath = "/card/user/Recipes/Unit A/"+PartName+".csv";
	}
	else
	{
		var recipePath = process_tree.selectedLine;
	}
	
	file.setFileName(recipePath);
	if (file.open(0x0001 | 0x0010))
	{
		line = file.readLine();
		data=line.toString();
		dat =data.split(";");
		if (dat[1] == PartName)
		{
			part_name_csv=dat[1];
			while(!file.atEnd())
			{
				line = file.readLine();
				data=line.toString();
				dat =data.split(";");
				
				if (dat[0]=="ORDER (JOURNAL)") 
				{
					for (i = 1; i < 51; i++)
					{
						WriteData("/nc/_n_ch_gd3_acx/ORDER[u1,"+ord+"]",dat[i]); // Process Speed Tempering
						ord = ord + 1;
						if (dat[i]>"0")
						{
							laps = laps + 1;
						}
					}
				}
				
				if (dat[0]=="ORDER (PROCESS)")
				{
					for (i = 1; i < 51; i++)
					{	
						WriteData("/nc/_n_ch_gd3_acx/ORDER_HT[u1,"+ords+"]",dat[i]); 
						ords = ords + 1;
					}
				}
			
				if ((cont >= 5) && (dat[0]!="ORDER (JOURNAL)") && (dat[0]!="ORDER (PROCESS)") && (dat[0]!=" ") && (dat[0]!="TEMPERATURE LIMITS") 
				&& (dat[1]!="ANGLE_UPPER") && (dat[1]!="TEMP_UPPER") && (dat[1]!="ANGLE_LOWER") && (dat[1]!="TEMP_LOWER"))
				{
					if (dat[5]=="FALSE")
					{ 
						dat[5] = "0";
					}
					
					if (dat[5]=="TRUE")
					{ 
						dat[5] = "1";
					}
					WriteData("/nc/_n_ch_gd3_acx/JOURNAL_NAME[u1,"+journIndex+"]",dat[0]); // Journal name	
					WriteData("/nc/_n_ch_gd3_acx/AXIAL_OFFSET[u1,"+offstH+"]", dat[1]); // Offset Y Hardening
					WriteData("/nc/_n_ch_gd3_acx/START_ANGLE[u1,"+angleH+"]", dat[2]); // Start Angle Hardening
					WriteData("/nc/_n_ch_gd3_acx/OVERLAP[u1,"+ovrlpH+"]", dat[3]); // Overlap Hardening
					WriteData("/nc/_n_ch_gd3_acx/PROCESS_SPEED[u1,"+feedH+"]", dat[4]); // Process Speed Hardening
					WriteData("/nc/_n_ch_gd3_acx/AXIAL_OFFSET[u1,"+offstT+"]", dat[11]); // Offset Y Tempering
					WriteData("/nc/_n_ch_gd3_acx/START_ANGLE[u1,"+angleT+"]", dat[12]); // Start Angle Tempering
					WriteData("/nc/_n_ch_gd3_acx/OVERLAP[u1,"+ovrlpT+"]", dat[13]); // Overlap Tempering
					WriteData("/nc/_n_ch_gd3_acx/PROCESS_SPEED[u1,"+feedT+"]", dat[14]); // Process Speed Tempering
					
					WriteData("/plc/datablock/byte[c1262, >"+pid+" ]", dat[5]); // PID Active 154
					pid = pid + 2;
					WriteData("/plc/datablock/float[c1262,>"+pid+"]", dat[10]); // Power Hardening 156
					pid = pid + 8;
					WriteData("/plc/datablock/float[c1262,>"+pid+" ]", dat[9]); // Target temperature 164
					pid = pid + 4;
					WriteData("/plc/datablock/float[c1262,>"+pid+" ]", dat[6]); // KFF 168
					pid = pid + 4;
					WriteData("/plc/datablock/float[c1262, >"+pid+" ]", dat[7]); // KP 172		
					pid = pid + 4;
					WriteData("/plc/datablock/float[c1262,>"+pid+" ]", dat[8]); // KI 176
					pid = pid + 6;
					WriteData("/plc/datablock/float[c1262,>"+pid+" ]", dat[15]); // Power Tempering 182
					pid = pid + 50;
					
					journIndex = journIndex + 1;
					offstH = offstH + 3;
					offstT = offstT + 3;
					angleH = angleH + 3;
					angleT = angleT + 3;
					ovrlpH = ovrlpH + 3;
					ovrlpT = ovrlpT + 3;
					feedH = feedH + 3;
					feedT = feedT + 3;
				}
				
				// Pyrometer temperature monitoring control system
				
				//*** Upper limit ***
				
				if (dat[1]=="ANGLE_UPPER") // Angles upper limit
				{
					cont_angle_max = angle_upper;
					
					for (i=2; i<dat.length; i++)
					{
						WriteData("/plc/datablock/float[c1300,>"+cont_angle_max+" ]", dat[i]);
						cont_angle_max = cont_angle_max + 4;
					}
					angle_upper = angle_upper + 160;
					j_cont = j_cont + 1;
				}
				
				if (dat[1]=="TEMP_UPPER") // Temperatures per angles in upper limit
				{
					cont_temp_max = temp_upper;
					
					for (i=2; i<dat.length; i++)
					{
						WriteData("/plc/datablock/float[c1300,>"+cont_temp_max+" ]", dat[i]);
						cont_temp_max = cont_temp_max + 4;
					}
					temp_upper = temp_upper + 160;
				}
				
				//*** Lower limit ***
				
				if (dat[1]=="ANGLE_LOWER") // Angles lower limit
				{
					cont_angle_min = angle_lower;
					
					for (i=2; i<dat.length; i++)
					{
						WriteData("/plc/datablock/float[c1300,>"+cont_angle_min+" ]", dat[i]);
						cont_angle_min = cont_angle_min + 4;
					}
						angle_lower = angle_lower + 160;
				}
			
				if (dat[1]=="TEMP_LOWER") // Temperatures per angles in lower limit
				{
					cont_temp_min = temp_lower;
					
					for (i=2; i<dat.length; i++)
					{
						WriteData("/plc/datablock/float[c1300,>"+cont_temp_min+" ]", dat[i]);
						cont_temp_min = cont_temp_min + 4;
					}
					temp_lower = temp_lower + 160;
				}
				cont = cont + 1;
			}
			WriteData("DB1262.DBW30",j_cont);  //Total journals		
			WriteData("DB1262.DBW28",laps);   //Total laps
			if ((ReadData("DB1262.DBX35.0")) == 0)
			{
				WriteData("DB1262.DBX34.2",1);   // Recipe loaded flag bit
			}
			
			WriteData("/nc/_n_ch_gd3_acx/PART_TYPE_NAME[u1]",part_name_csv);
			WriteData("/nc/_n_ch_gd3_acx/PART_TYPE_NAME[u2]",part_name_csv);
			
			WriteData("M630.0",1);      //File has been opened -> Recipe correctly loaded
			file.close();
		}
		else
		{
			WriteData("M630.0",0);
		}
	}
	
	if ((ReadData("M630.0"))==1)    //File opened?
	{
		WriteData("M630.1",0);      //Reset "Recipe not loaded" bit
	}
	else
	{
		WriteData("M630.1",1);      //Set "Recipe not loaded" bit
	}
	WriteData("M630.2",1);          //Script A finished flag
	WriteData("M630.0",0);          //Reset File Opened Flag
}