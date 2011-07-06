(ns chessrules)

(use 'clojure.contrib.str-utils) 
(use '[clojure.contrib.string :only (replace-str)])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;Forward declares

(declare can-move? reach? piece-reach? str-to-coords str-to-coords-1 str-to-coords-2 
         coords-to-string is-legal? all-moves legal-moves has-legal-moves? piece-attacks is-check? is-check-mate?)

;End forward declares
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;General functions and definitions

(def chessrules-version "0.01")

(def abs 
  (fn [n]
    (if (< n 0) (- n) n)))

(def row-from-square 
  (fn [square] 
    (bit-shift-right square 3)))

(def col-from-square 
  (fn [square] 
    (bit-and square 7)))

(def row-col-to-square
  (fn [row col]
    (+ (* row 8) col)))

(def is-diagonal?
  (fn [sq1 sq2]
    (== (abs (- (row-from-square sq1) (row-from-square sq2))) (abs (- (col-from-square sq1) (col-from-square sq2))))))

(def is-same-row?
  (fn [sq1 sq2]
    (== (row-from-square sq1) (row-from-square sq2))))

(def is-same-col?
  (fn [sq1 sq2]
    (== (col-from-square sq1) (col-from-square sq2))))

(def distance
  (fn [sq1 sq2]
    (let [file1 (bit-and sq1 7) file2 (bit-and sq2 7) rank1 (bit-shift-right sq1 3) rank2 (bit-shift-right sq2 3)]
       (max (abs (- file1 file2)) (abs (- rank1 rank2))))))

(def diff-row
  (fn [sq1 sq2]
    (abs (- (row-from-square sq1) (row-from-square sq2)))))

(def diff-col
  (fn [sq1 sq2]
    (abs (- (col-from-square sq1) (col-from-square sq2)))))

(def square-to-algebraic
  (fn [square]
    (str (char (+ 97 (col-from-square square))) (+ 1 (row-from-square square)))))

(def algebraic-to-square
  (fn [pgnsq]
    (if (< (count pgnsq) 2)
      -1
       (let [col (- (int ((vec pgnsq) 0)) 97)
             row (- (int ((vec pgnsq) 1)) 49)
             ]
         (row-col-to-square row col)))))


(defn sq-path [sq1 sq2]
  (if-not (or
            (is-diagonal? sq1 sq2)
            (is-same-row? sq1 sq2)
            (is-same-col? sq1 sq2))
    #{}
    (let [sq-min (min sq1 sq2) 
          sq-max (max sq1 sq2)
          step (cond
                (is-diagonal? sq-min sq-max) (if (< (col-from-square sq-min) (col-from-square sq-max)) 9 7)
                (is-same-col? sq-min sq-max) 8
                (is-same-row? sq-min sq-max) 1)
          ]
      (apply sorted-set (range (+ sq-min step) sq-max step)))))

      
;End General functions and definitions
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;FEN related functions and definitions

(def default-fen "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")

(def FEN {
          :white-pieces #{\K \Q \R \B \N \P}
          :black-pieces #{\k \q \r \b \n \p}
          :sliding #{\Q \R \B \q \r \b}
          }
  )

(defn pp-expand 
  ([]
    (pp-expand ((vec (re-seq #"[\w/\-]+" default-fen)) 0)))
  ([pp]
    (apply str (apply concat (for [x pp] ((fn [n] (if (> (int n) 57) [n] (repeat (- (int n) 48) \0))) x)))))
)

(defn pp-compress 
  ([] (pp-compress (pp-expand)))
  ([pp]
  (let [pre-ret (re-gsub #"\w{8}(?!$)" (fn [m] (str m "/")) pp)] (re-gsub #"0{1,8}" (fn [m] (str (count m))) pre-ret)))
)

(defn- en-passant? [fen from to]
  (let [
        orig-piece (get (fen :board-array) from)
        piece (.toUpperCase (str orig-piece))
        ]
    (and (= piece "P") (= (fen :en-passant) (square-to-algebraic to)))))

(defn- castling-type [fen from to]
  (let [piece (get (fen :board-array) from)]
    (cond
      (and (= from 4) (= to 6) (= piece \K)) :wsc
      (and (= from 4) (= to 2) (= piece \K)) :wlc
      (and (= from 60) (= to 62) (= piece \k)) :bsc
      (and (= from 60) (= to 58) (= piece \k)) :blc
      :default nil)))

(defn- castling-string [fen from to]
  (let [epp (fen :expanded-piece-placement)]
    (cond
      (= (castling-type fen from to) :wsc) (apply str (assoc (vec epp) (bit-xor 5 56) \R (bit-xor 7 56) \0))
      (= (castling-type fen from to) :wlc) (apply str (assoc (vec epp) (bit-xor 3 56) \R (bit-xor 0 56) \0))
      (= (castling-type fen from to) :bsc) (apply str (assoc (vec epp) (bit-xor 61 56) \r (bit-xor 63 56) \0))
      (= (castling-type fen from to) :blc) (apply str (assoc (vec epp) (bit-xor 59 56) \r (bit-xor 56 56) \0))
      :default epp)))

(defn make-fen
  ([] (make-fen default-fen))
  ([fen-str]
    (let [fen-array (vec (re-seq #"[\w/\-]+" fen-str))
          piece-placement (fen-array 0)
          active-color (fen-array 1)
          castling-avail (fen-array 2)
          en-passant (fen-array 3)
          half-move-clock (fen-array 4)
          full-move-number (fen-array 5)
          expanded-piece-placement  (pp-expand piece-placement)
          ascii-board (str (apply str (interpose "\n" (re-seq #"\w{8}" expanded-piece-placement))) "\n")
          board-array (for [x (range 64)] ((vec expanded-piece-placement) (bit-xor x 56)))
          resp  {
                 :version chessrules-version
                 :fen-string fen-str
                 :fen-array fen-array
                 :piece-placement piece-placement
                 :active-color active-color
                 :castling-avail castling-avail
                 :en-passant en-passant
                 :half-move-clock half-move-clock
                 :full-move-number full-move-number
                 :expanded-piece-placement expanded-piece-placement
                 :ascii-board ascii-board
                 :print #(println ascii-board)
                 :board-array (vec board-array)
                 :white-indexes (set (for [n (range 64) :when (contains? (FEN :white-pieces) ((vec board-array) n))] n))
                 :black-indexes (set (for [n (range 64) :when (contains? (FEN :black-pieces) ((vec board-array) n))] n))
                 }
          ]
          resp)))

(defn board-index [fen sq]
  (get (fen :board-array) sq))

(defn black-piece? [fen sq]
  (contains? (FEN :black-pieces) (board-index fen sq)))

(defn white-piece? [fen sq]
  (contains? (FEN :white-pieces) (board-index fen sq)))

(defn empty-square? [fen sq]
  ;(not (or (white-piece? fen sq) (black-piece? fen sq))))
  (= (board-index fen sq) \0))

(defn friend? [fen sq-orig sq-dest]
  (or
    (and (white-piece? fen sq-orig) (white-piece? fen sq-dest))
    (and (black-piece? fen sq-orig) (black-piece? fen sq-dest))))

(defn foe? [fen sq-orig sq-dest]
  (or
    (and (white-piece? fen sq-orig) (black-piece? fen sq-dest))
    (and (black-piece? fen sq-orig) (white-piece? fen sq-dest))))

(defn empty-or-foe? [fen sq-orig sq-dest]
  (or
    (foe? fen sq-orig sq-dest)
    (empty-square? fen sq-dest)))

(defn empty-path? [fen sq1 sq2]
  (let [board (fen :board-array)]
    (every? #(= (get board %) \0) (sq-path sq1 sq2))))

(defn king-square [fen side]
  (let [target (if (= side \w) \K \k)]
    (loop [n 0 top 64]
      (if (>= n top)
        nil
        (if (= (get (fen :board-array) n) target)
          n
          (recur (inc n) top))))))

(defn- reach? [fen sq-orig sq-dest]
  (if (or (< sq-orig 0) (< sq-dest 0) (> sq-orig 63) (> sq-dest 63)) false
    (let [piece ((fen :board-array) sq-orig) 
          key-piece (keyword (.toUpperCase (str piece)))]
      (piece-reach? {:sq-orig sq-orig
                  :sq-dest sq-dest
                  :piece piece
                  :type key-piece
                  :fen fen  
                  }))))

(defn square-attacks [fen attackers sq]
  (vec (for [n attackers :when (can-move? fen n sq)] n)))

(defn count-square-attacks [fen attackers sq]
  (count (square-attacks fen attackers sq)))

(defn is-check? [fen side]
  (let [
        foes (if (= side \w) (fen :black-indexes) (fen :white-indexes))
        square (king-square fen side)
        ]
    (not (zero? (count-square-attacks fen foes square)))))
    
(defmulti piece-reach? :type)

(defmethod piece-reach? :K
  [move-info]
  (let [{:keys [fen piece sq-orig sq-dest]} move-info]
    (cond 
      (> (diff-row sq-orig sq-dest) 1) false
      (> (diff-col sq-orig sq-dest) 2) false
      (= sq-orig sq-dest) false
      (and (= (diff-col sq-orig sq-dest) 2) (not (= (diff-row sq-orig sq-dest) 0))) false
      (and (= (diff-col sq-orig sq-dest) 2) (= (diff-row sq-orig sq-dest) 0))
        (let [foes (if (= piece \K) (fen :black-indexes) (fen :white-indexes))]
          (cond 
            (and (= piece \k) (= sq-orig 60) (= sq-dest 62)) 
              (and 
                (zero? (reduce + (for [n (range 60 63)] (count-square-attacks fen foes n)))) 
                (empty-square? fen 61) 
                (empty-square? fen 62)
                (re-find #"k" (fen :castling-avail))
                true)
            (and (= piece \k) (= sq-orig 60) (= sq-dest 58)) 
              (and 
                (zero? (reduce + (for [n (range 58 61)] (count-square-attacks fen foes n)))) 
                (empty-square? fen 58) 
                (empty-square? fen 59)
                (re-find #"q" (fen :castling-avail))
                true)
            (and (= piece \K) (= sq-orig 4) (= sq-dest 6)) 
              (and 
                (zero? (reduce + (for [n (range 4 7)] (count-square-attacks fen foes n)))) 
                (empty-square? fen 5) 
                (empty-square? fen 6)
                (re-find #"K" (fen :castling-avail))
                true)
            (and (= piece \K) (= sq-orig 4) (= sq-dest 2)) 
              (and 
                (zero? (reduce + (for [n (range 2 5)] (count-square-attacks fen foes n)))) 
                (empty-square? fen 2) 
                (empty-square? fen 3)
                (re-find #"Q" (fen :castling-avail))
                true)
            :default false))
      :default true)
    ))

(defmethod piece-reach? :Q
  [move-info]
  (let [{:keys [sq-orig sq-dest]} move-info]
  (cond
    (or (is-same-row? sq-orig sq-dest) (is-same-col? sq-orig sq-dest)) (piece-reach? (assoc move-info :type :R))
    (is-diagonal? sq-orig sq-dest) (piece-reach? (assoc move-info :type :B))
    :default false)))

(defmethod piece-reach? :R
  [move-info]
  (let [{:keys [fen piece sq-orig sq-dest]} move-info]
    (if-not (and (or (is-same-row? sq-orig sq-dest)(is-same-col? sq-orig sq-dest)) (not (= sq-orig sq-dest)))
      false
      (empty-path? fen sq-orig sq-dest))))

(defmethod piece-reach? :B
  [move-info]
  (let [{:keys [fen piece sq-orig sq-dest]} move-info]
    (if-not (and (is-diagonal? sq-orig sq-dest) (not (= sq-orig sq-dest)))
      false
      (empty-path? fen sq-orig sq-dest))))

(defmethod piece-reach? :N
  [move-info]
  (let [{:keys [sq-orig sq-dest]} move-info
         drows (diff-row sq-orig sq-dest)
         dcols (diff-col sq-orig sq-dest)
        ]
    (or (and (= drows 2) (= dcols 1)) (and (= drows 1) (= dcols 2)))
    ))

(defmethod piece-reach? :P
  [move-info]
  (let [{:keys [fen piece sq-orig sq-dest]} move-info
        direction (if (= piece \p) - +)
        drows (diff-row sq-orig sq-dest)
        dcols (diff-col sq-orig sq-dest)
        orig-row (row-from-square sq-orig)
        orig-col (col-from-square sq-orig)
        dest-row (row-from-square sq-dest)
        dest-col (col-from-square sq-dest)
        ]
    (cond
      (< drows 1) false
      (> drows 2) false
      (> dcols 1) false
      (= drows 2) (if (and (= dcols 0) (empty-square? fen sq-dest) (empty-square? fen (direction sq-orig 8))  
                           (or (and (= piece \p) (= orig-row 6)) (and (= piece \P) (= orig-row 1)))) true false)
      (= drows 1) (cond 
                        (= dcols 0) 
                        (if (and (empty-square? fen sq-dest) (or (and (= piece \p) (< dest-row orig-row)) (and (= piece \P) (> dest-row orig-row)))) true false)
                        (= dcols 1)
                        (if (and (or (and (= piece \p) (< dest-row orig-row)) (and (= piece \P) (> dest-row orig-row)))
                                 (or (foe? fen sq-orig sq-dest) (and (> (count (fen :en-passant)) 1) 
                                                                     (= sq-dest (algebraic-to-square (fen :en-passant)))))) true false)
                    )
      :default false
      )
    ))

(defmethod piece-reach? :default
  [move-info]
  false)

(defn- can-move? 
  ([fen sq-orig sq-dest]
    (and
      (>= sq-orig 0) (< sq-orig 64) (>= sq-dest 0) (< sq-dest 64)
      (reach? fen sq-orig sq-dest)
      (empty-or-foe? fen sq-orig sq-dest)
    ))
  ([fen move-str]
   (let [{:keys [from to]} (str-to-coords fen move-str)]
    (can-move? fen from to)))) 

(def can-move? (memoize can-move?))

(defmulti move 
  (fn [& args] (let [[fen move-info] args] (class move-info))))

(defmethod move String
  [fen move-info] (move fen (str-to-coords fen move-info)))

(defmethod move clojure.lang.PersistentArrayMap
  [fen move-info] 
  (if (or 
        (< (move-info :from) 0) 
        (< (move-info :to) 0) 
        (> (move-info :from) 63)
        (> (move-info :to) 63)
        (or (= (move-info :to) (king-square fen \w)) (= (move-info :to) (king-square fen \b))) 
        (not (can-move? fen (move-info :from) (move-info :to))))  nil
    (let [{:keys [from to crowning]} move-info
          fw (if (= (fen :active-color) "w") + -) 
          bk (if (= (fen :active-color) "w") - +) 
          in-arr-from (bit-xor from 56)
          in-arr-to (bit-xor to 56)
          orig-piece (get (fen :board-array) from)  
          dest-piece (get (fen :board-array) to)  
          old-board (vec (castling-string fen from to))
          intermediate-board (if (en-passant? fen from to) (assoc old-board (bit-xor (bk to 8) 56) \0) old-board)
          board (assoc intermediate-board in-arr-from \0 in-arr-to (if crowning 
                                                          (if (= (fen :active-color) "w") 
                                                            (get (.toUpperCase (str crowning)) 0) 
                                                            (get (.toLowerCase (str crowning)) 0))
                                                          (get intermediate-board in-arr-from))
                      )

          expanded-pp (apply str board)
          compressed-pp (pp-compress expanded-pp)
          active-color (if (= (fen :active-color) "w") "b" "w")
          castling-avail (cond
                           (= from 7) (if (= (replace-str "K" "" (fen :castling-avail)) "") "-" (replace-str "K" "" (fen :castling-avail)))
                           (= from 0) (if (= (replace-str "Q" "" (fen :castling-avail)) "") "-" (replace-str "Q" "" (fen :castling-avail)))
                           (= from 63) (if (= (replace-str "k" "" (fen :castling-avail)) "") "-" (replace-str "k" "" (fen :castling-avail)))
                           (= from 56) (if (= (replace-str "q" "" (fen :castling-avail)) "") "-" (replace-str "q" "" (fen :castling-avail)))
                           (= from 4) (if (= (replace-str "Q" "" (replace-str "K" "" (fen :castling-avail))) "") "-" 
                                        (replace-str "Q" "" (replace-str "K" "" (fen :castling-avail))))
                           (= from 60) (if (= (replace-str "q" "" (replace-str "k" "" (fen :castling-avail))) "") "-" 
                                        (replace-str "q" "" (replace-str "k" "" (fen :castling-avail))))
                           :default (fen :castling-avail))
          en-passant (cond
                       (and (= orig-piece \P) (= (row-from-square from) 1) (= (row-from-square to) 3)) (square-to-algebraic (- to 8))
                       (and (= orig-piece \p) (= (row-from-square from) 6) (= (row-from-square to) 4)) (square-to-algebraic (+ to 8))
                       :default "-")
                    
          half-move-clock (if (or (= orig-piece \p) (= orig-piece \P) (not (= dest-piece \0)))
                            "0"
                            (str (+ 1 (Integer/parseInt (fen :half-move-clock))))
                           )
          full-move-number (if (= (fen :active-color) "b") 
                              (str (+ 1 (Integer/parseInt (fen :full-move-number))))
                              (fen :full-move-number))
          fen-string (apply str (interpose " " [compressed-pp active-color castling-avail en-passant half-move-clock full-move-number]))
          new-fen (make-fen fen-string)
          check-str (if (or (is-check? new-fen \w) (is-check? new-fen \b)) 
                      (if (= (new-fen :active-color) "w")
                        (if (is-check-mate? new-fen \w)
                          "#" "+")
                        (if (is-check-mate? new-fen \b)
                          "#" "+"))
                      "")
          ]
        (if (is-legal? new-fen)
          (assoc new-fen :parent-fen (fen :fen-string) :parent-move (str (coords-to-string fen move-info) check-str))
          nil))))

(defn str-to-coords 
  [fen move-info]
  (let [
        pat1 #"^([a-h][1-8])[-x\s]?([a-h][1-8])=?([NBRQnbrq])?([+#])?$"
        pat2 #"^(?:(?:([a-h])(?:(x[a-h][1-8])|([1-8]))(?:=?([NBRQnbrq]))?)|(?:([NBRQK])([a-h])?([1-8])?x?([a-h][1-8]))|([0O]-[0O])|([0O]-[0O]-[0O]))(?:[+#]?)$"
        match1 (re-find pat1 move-info)
        match2 (re-find pat2 move-info)
        ]
    (cond 
      match1 (str-to-coords-1 match1)
      match2 (str-to-coords-2 fen match2)
      :default nil)))


(defn- str-to-coords-1
  [match-info]
  {
   :from (algebraic-to-square (get match-info 1))
   :to (algebraic-to-square (get match-info 2))
   :crowning (if (get match-info 3) (.toUpperCase (get match-info 3)) nil)
   })

(defn- str-to-coords-2
  [fen match-info]
  (let [
        [_ pawn pawn-capture pawn-dest-row crowning piece orig-piece-col orig-piece-row piece-destination short-castling long-castling] match-info
        the-friends (if (= (fen :active-color) "w") (fen :white-indexes) (fen :black-indexes))
        ]
    (cond
      (and short-castling true) {:from (if (= (fen :active-color) "w") 4 60) :to (if (= (fen :active-color) "w") 6 62)} 
      (and long-castling true) {:from (if (= (fen :active-color) "w") 4 60) :to (if (= (fen :active-color) "w") 2 58)} 
      (and pawn true) (let [
                            the-piece (if (= (fen :active-color) "w") \P \p)
                            the-peers (vec (for [n the-friends :when (= (get (fen :board-array) n) the-piece)] n))
                            orig-col (- (int (get pawn 0)) 97)
                            dest-col (if pawn-dest-row orig-col (- (int (get pawn-capture 1)) 97))
                            dest-row (if pawn-dest-row (- (int (get pawn-dest-row 0)) 49) (- (int (get pawn-capture 2)) 49)) 
                            sq-to (row-col-to-square dest-row dest-col)
                            sq-from (loop [i 0 end (count the-peers)]
                                      (if (= i end)
                                        -1
                                        (if (and (= orig-col (col-from-square (get the-peers i))) (reach? fen (get the-peers i) sq-to))
                                          (get the-peers i)
                                          (recur (inc i) end))))
                            ]
                        {:to sq-to :from sq-from :crowning crowning})
      (and piece true) (let [
                             sq-to (algebraic-to-square piece-destination)
                             the-piece (get (if (= (fen :active-color) "w") (.toUpperCase piece) (.toLowerCase piece)) 0)
                             the-peers (vec (for [n the-friends :when (and (= (get (fen :board-array) n) the-piece) (reach? fen n sq-to))] n))
;                              the-peers (vec (for [n the-friends :when (and (= (get (fen :board-array) n) the-piece) true)] n))
                             sq-from (cond 
                                       (= (count the-peers) 0) -1
                                       (= (count the-peers) 1) (get the-peers 0)
                                       (> (count the-peers) 1) (cond
                                                                 (and orig-piece-col orig-piece-row) 
                                                                 (let [
                                                                       row (- (int (get orig-piece-row 0)) 49)
                                                                       col (- (int (get orig-piece-col 0)) 97)
                                                                       ]
                                                                   (row-col-to-square row col))
                                                                 (and orig-piece-col true)
                                                                 (let [
                                                                       col (- (int (get orig-piece-col 0)) 97)
                                                                       ]
                                                                   (get (vec (for [n the-peers :when (= (col-from-square n) col)] n)) 0))
                                                                 (and orig-piece-row true)
                                                                 (let [
                                                                       row (- (int (get orig-piece-row 0)) 49)
                                                                       ]
                                                                   (get (vec (for [n the-peers :when (= (row-from-square n) row)] n)) 0))
                                                                 :default -1)

                                          
                                       :default -1)
                             ] 
        {:from sq-from :to sq-to})
      :default {:from -1 :to -1})))

(defn coords-to-string [fen coords]
  (let [
        {:keys [from to crowning]} coords
        piece-orig (get (fen :board-array) from)
        capture (if (empty-square? fen to) "" "x")
        upper-piece-orig (if (or (= piece-orig \p) (= piece-orig \P)) 
                           (if (empty? capture) "" (str (char (+ (col-from-square from) 97))))
                           (.toUpperCase (str piece-orig)))
        candidates (vec (filter #(and (can-move? fen % to) (not (= % from)) (= piece-orig (get (fen :board-array) %))) 
                                (if (black-piece? fen from) (fen :black-indexes) (fen :white-indexes))))
        col-extra-info (if (zero? (count candidates)) 
                         ""
                         (if (is-same-col? from (get candidates 0))
                           ""
                           (char (+ (col-from-square from) 97))))
        row-extra-info (if (or (zero? (count candidates)) (not (= col-extra-info ""))) 
                         ""
                         (if (is-same-row? from (get candidates 0))
                           ""
                           (char (+ (row-from-square from) 49))))
        ]
  (apply str [upper-piece-orig col-extra-info row-extra-info capture (square-to-algebraic to) (str crowning)])))

(defn is-legal? [fen]
  (or 
    (and (not (is-check? fen \w)) (not (is-check? fen \b))) 
    (and (is-check? fen \w) (= (fen :active-color) "w")) 
    (and (is-check? fen \b) (= (fen :active-color) "b")))) 


(defn all-moves [fen side]
  (let [
        friends (if (= side \w) (fen :white-indexes) (fen :black-indexes))
        resting (clojure.set/difference (set (range 64)) friends)
        ]
    (set (for [from friends to resting :when (can-move? fen from to)] {:from from :to to}))))
        
(def all-moves (memoize all-moves))

(defn legal-moves [fen side]
  (set (filter #(not (nil? (move fen %))) (all-moves fen side))))

(def legal-moves (memoize legal-moves))

(defn has-legal-moves? [fen side]
  (not (empty? (legal-moves fen side))))

(defn is-check-mate? [fen side]
  (and (is-check? fen side) (not (has-legal-moves? fen side))))

(defn is-stale-mate? [fen side]
  (and (not (is-check? fen side)) (not (has-legal-moves? fen side))))

  
;End FEN related functions and definitions
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;Auxiliary functions and definitions

(defn make-moves [move-list]
  (let [fen-list [(make-fen)]]
    (loop [counter 0 top (count move-list) fen-l fen-list]
      (if (= counter top)
        fen-l
        (recur (inc counter) top (conj fen-l (move (last fen-l) (get move-list counter))))))))

(def famous-games {
                   :pastor ["e4" "e5" "Bc4" "d6" "Qf3" "a6" "Qf7"] 
                   :polerio ["e4" "b6" "d4" "Bb7" "Bd3" "f5" "exf5" "Bxg2" "Qh5" "g6" "fxg6" "Nf6" "gxh7" "Nxh5" "Bg6"]
                   :helped-in-6 ["h4" "d5" "h5" "Nd7" "h6" "Ndf6" "hxg7" "Kd7" "Rh6" "Ne8" "gxf8N"]
                   })

;End Auxiliary functions and definitions
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

