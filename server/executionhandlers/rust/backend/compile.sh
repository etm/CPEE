CDIR=$(dirname "$0")
cd $CDIR
echo "echo i compile hard" > run
chmod 700 run
cargo instance.rs
