import React, { useState } from "react";
import Web3 from "web3";
import abi from "./abi";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import {
  Container,
  Grid,
  Card,
  Typography,
  Button,
  CardMedia,
  CircularProgress ,
  FormControl,
  TextField,
} from "@material-ui/core";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexFlow: "column nowrap",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100vw",
    backgroundColor: "#f9cff2",
    padding: 0,
    height: "100vh",
  },
  cardContainer: {
    flexFlow: "row wrap",
    justifyContent: "space-around",
    alignItems: "center",
    borderBottom: "1px solid #52154e",
    height: "40%",
    width: "100%",
    overflowY: "scroll",
  },
  bottomContainer: {
    display: "flex",
    flexFlow: "column nowrap",
    justifyContent: "flex-start",
    alignItems: "center",
    height: "60%",
    width: "100%",
  },
  progressContainer: {
    display: "flex",
    flexFlow: "column nowrap",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100px",
    height: "100px",
    display: "flex",
    flexFlow: "column nowrap",
    alignItems: "center",
    margin: "5px 0",
    justifyContent: "space-around",
    backgroundColor: "#52154E",
  },
  bigCard: {
    width: "200px",
    height: "200px",
    display: "flex",
    flexFlow: "column nowrap",
    alignItems: "center",
    margin: "5px 0",
    justifyContent: "flex-start",
    backgroundColor: "#52154E",
    overflowY: "scroll",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    padding: "5px",
  },
  button: {
    width: "45%",
    fontSize: "12px",
    margin: "5px",
    backgroundColor: "#52154e",
    color: "white",
    "&:hover": {
      backgroundColor: "rgba(82, 21, 78, .5)",
    },
  },
  form: {
    display: "flex",
    flexFlow: "row nowrap",
    justifyContent: "space-around",
    alignItems: "center",
  },
  input: {
    width: "45%",
    marginTop: "10px",
  },
  progress: {
    height: "50px",
    width: "50px",
    color: "#111344",
  },
  image: {
    height: "50px",
    width: "50px",
    paddingTop: "56.25%",
  },
  bigImage: {
    minHeight: "100px",
    width: "100px",
  },
  idText: {
    fontSize: "12px",
    color: "white",
  },
});

function App() {
  /* MATERIAL UI VARIABLES */
  const classes = useStyles();

  /* WEB3 CONSTANTS */
  const web3 = new Web3(process.env.REACT_APP_URL);
  const birthTopic = web3.utils.sha3(
    "Birth(address,uint256,uint256,uint256,uint256)"
  );
  const address = process.env.REACT_APP_CONTRACT_ADDRESS;
  const contract = new web3.eth.Contract(abi, address);

  /* STATE */
  const [birthData, setBirthData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [motherLoading, setMotherLoading] = useState(false);
  const [loadProgess, setLoadProgress] = useState(0);
  const [mostBirths, setMostBirths] = useState({ id: null });
  const [startingBlock, setStartingBlock] = useState("");
  const [endingBlock, setEndingBlock] = useState("");
  const [errorInput1, setErrorInput1] = useState(false);
  const [helperText1, setHelper1] = useState(false);
  const [errorInput2, setErrorInput2] = useState(false);
  const [helperText2, setHelper2] = useState(false);
  const [toggleMother, setToggleMother] = useState(false);

  /* METHODS */
  const loadList = async (startingBlock, endingBlock) => {
    startingBlock = Number(startingBlock);
    endingBlock = Number(endingBlock);
    if (!startingBlock || !endingBlock) {
      if (!startingBlock) {
        setErrorInput1(true);
        setHelper1("Block number needed.");
      }
      if (!endingBlock) {
        setErrorInput2(true);
        setHelper2("Block number needed.");
      }
    } else if (endingBlock < startingBlock) {
      setErrorInput1(true);
      setErrorInput2(true);
      setHelper1("Starting block must be less than ending block.");
      setHelper2("Starting block must be less than ending block.");
    } else {
      const resultArr = [];
      const runCount = Math.ceil((endingBlock - startingBlock) / 1000);
      const loadIncrementer = runCount/100
      try {
        for (let i = 0; i < runCount; i++) {
          setLoadProgress(loadProgess => loadProgess += (1/loadIncrementer))
          if (endingBlock - startingBlock < 1000) {
            const result = await contract.getPastEvents({
              event: "Birth",
              fromBlock: startingBlock,
              toBlock: endingBlock,
              topics: [birthTopic],
            });
            resultArr.push(...result);
          } else {
            if (i === runCount - 1) {
              const result = await contract.getPastEvents({
                event: "Birth",
                fromBlock: startingBlock + i * 1000,
                toBlock: endingBlock,
                topics: [birthTopic],
              });
              resultArr.push(...result);
            } else {
              const result = await contract.getPastEvents({
                event: "Birth",
                fromBlock: startingBlock + i * 1000,
                toBlock: startingBlock + ((i + 1) * 1000 - 1),
                topics: [birthTopic],
              });
              resultArr.push(...result);
            }
          }
        }
        setBirthData([...resultArr]);

      } catch (error) {
        if (
          error.message ===
          "Returned error: query returned more than 10000 results"
        ) {
          setErrorInput2(true);
          setHelper2("Result limit reached. Please choose a lower ending block.");

          
        } else {
          throw new Error(error);
        }
      }

    }
  };

  const findMostBirths = async () => {
    const matronIdCount = {};
    let mostBirthsCount = 0;
    let mostBirthsId = null;
    let loadIncrementer = birthData.length/100
    for (let i = 0; i < birthData.length; i++) {
      setLoadProgress((loadProgess) => (loadProgess += 1 / loadIncrementer));
      try {
        if (matronIdCount.hasOwnProperty(birthData[i].returnValues.matronId)) {
          matronIdCount[birthData[i].returnValues.matronId]++;
        } else {
          matronIdCount[birthData[i].returnValues.matronId] = 1;
        }
        if (
          matronIdCount[birthData[i].returnValues.matronId] >=
            mostBirthsCount &&
          birthData[i].returnValues.matronId !== "0"
        ) {
          mostBirthsCount = matronIdCount[birthData[i].returnValues.matronId];
          mostBirthsId = birthData[i].returnValues.matronId;
        }
      } catch (err) {
        throw new Error(err);
      }
    }
    let result = await contract.methods.getKitty(mostBirthsId).call();
    console.log(result.genes, mostBirthsCount, mostBirthsId);
    setMostBirths({ id: mostBirthsId, ...result });
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.name === "startingBlock") {
      setStartingBlock(e.target.value);
      if (isNaN(Number(e.target.value)) && e.target.value !== "") {
        setErrorInput1(true);
        setHelper1("Input must be an integer.");
      } else {
        setErrorInput1(false);
        setHelper1(null);
      }
    }
    if (e.target.name === "endingBlock") {
      setEndingBlock(e.target.value);
      if (isNaN(Number(e.target.value)) && e.target.value !== "") {
        setErrorInput2(true);
        setHelper2("Input must be an integer.");
      } else {
        setErrorInput2(false);
        setHelper2(null);
      }
    }
  };

  return (
    <Container className={classes.container}>
      <Typography variant="caption" className={classes.idText}>
        Total Kitties Born: {birthData.length}
      </Typography>
      <Grid container className={classes.cardContainer}>
        {
          loading === true ? (
            <Grid item className={classes.progressContainer}>
              <Typography variant="caption" className={classes.idText}>
                Searching for kitties...
              </Typography>
              <CircularProgress
                className={classes.progress}
                variant="static"
                value={loadProgess}
              />
            </Grid>
          ) : null
          /* Visual Representation of each kitty for small datasets */

          //   birthData.map((kitty) => {
          //   return (
          //     <Card className={classes.card} key={kitty.returnValues.kittyId}>
          //       <Link
          //         to={{
          //           pathname: `https://www.cryptokitties.co/kitty/${kitty.returnValues.kittyId}`,
          //         }}
          //         target="_blank"
          //         style={{ textDecoration: "underline" }}
          //       >
          //         {<CardMedia
          //           image={`https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/${kitty.returnValues.kittyId}.svg`}
          //           className={classes.image}
          //         />}
          //         <Typography variant="caption" className={classes.idText}>
          //           ID: {kitty.returnValues.kittyId}
          //         </Typography>
          //       </Link>
          //     </Card>
          //   );
          // })
        }
      </Grid>
      <Grid className={classes.bottomContainer}>
        <FormControl className={classes.form}>
          <TextField
            variant="outlined"
            inputProps={{
              style: { fontSize: "12px" },
            }}
            InputLabelProps={{
              style: {
                fontSize: "12px",
                color: "black",
              },
            }}
            FormHelperTextProps={{ style: { fontSize: "8px" } }}
            className={classes.input}
            label="Starting Block"
            name="startingBlock"
            placeholder="eg. 6507985"
            value={startingBlock}
            size="small"
            onChange={(e) => handleChange(e)}
            error={errorInput1}
            helperText={helperText1}
          />
          <TextField
            variant="outlined"
            inputProps={{
              style: { fontSize: "12px" },
            }}
            InputLabelProps={{
              style: {
                fontSize: "12px",
                color: "black",
              },
            }}
            FormHelperTextProps={{ style: { fontSize: "8px" } }}
            className={classes.input}
            label="Ending Block"
            name="endingBlock"
            placeholder="eg. 6509440"
            value={endingBlock}
            size="small"
            onChange={(e) => handleChange(e)}
            error={errorInput2}
            helperText={helperText2}
          />
        </FormControl>
        <Grid className={classes.buttonContainer}>
          <Button
            className={classes.button}
            onClick={async (e) => {
              e.preventDefault();
              setBirthData([]);
              setMostBirths({});
              setLoading(true);
              await loadList(startingBlock, endingBlock);
              setLoading(false);
              setLoadProgress(0);
              setStartingBlock("");
              setEndingBlock("");
            }}
          >
            Find Kitties
          </Button>
          {birthData.length === 0 ? null : (
            <Button
              className={classes.button}
              onClick={async (e) => {
                e.preventDefault();
                setToggleMother(true);
                setMotherLoading(true);
                await findMostBirths();
                setMotherLoading(false);
                setLoadProgress(0);
              }}
            >
              Find Momma Kitty
            </Button>
          )}
        </Grid>
        {toggleMother === false ? null : motherLoading === true ? (
          <Grid item className={classes.progressContainer}>
            <Typography variant="caption" className={classes.idText}>
              Calculating Momma Kitty...
            </Typography>
            <CircularProgress
              className={classes.progress}
              variant="static"
              value={loadProgess}
            />
          </Grid>
        ) : (
          <Card className={classes.bigCard}>
            <CardMedia
              image={`https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/${mostBirths.id}.svg`}
              className={classes.bigImage}
            />
            <Link
              to={{
                pathname: `https://www.cryptokitties.co/kitty/${mostBirths.id}`,
              }}
              target="_blank"
              style={{ textDecoration: "underline" }}
            >
              <Typography variant="caption" className={classes.idText}>
                ID: {mostBirths.id}
              </Typography>
            </Link>
            <Typography variant="caption" className={classes.idText}>
              Generation: {mostBirths.generation}
            </Typography>
            <Typography variant="caption" className={classes.idText}>
              Birthday: {mostBirths.birthTime}
            </Typography>
            <Link
              to={{
                pathname: `https://kittycalc.co/read/?k1=${mostBirths.id}&k2=461679`,
              }}
              target="_blank"
              style={{ textDecoration: "underline" }}
            >
              <Typography variant="caption" className={classes.idText}>
                Genes
              </Typography>
            </Link>
          </Card>
        )}
      </Grid>
    </Container>
  );
}

export default App;
